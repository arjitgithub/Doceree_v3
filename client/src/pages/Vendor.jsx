import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../DocHubLayoutDesign/vendor.css";
import VendorInfoDotsFx from "../components/VendorInfoDotsFx.jsx";
import Footer from "../components/Footer.jsx";

// Deterministic “random” accent color from a string (stable across renders).
// We hash the vendor name into a hue, then create an HSL color.
function hashStringToHue(input) {
  const s = String(input || "");
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 360;
}

function accentColorFromName(name) {
  const hue = hashStringToHue(name);
  return `hsl(${hue} 92% 48%)`;
}

// Simple split: exactly half the characters in black, half in accent.
function splitVendorNameHalf(name) {
  const n = String(name || "");
  if (!n) return { base: "", accent: "" };
  const splitAt = Math.ceil(n.length / 2);
  return { base: n.slice(0, splitAt), accent: n.slice(splitAt) };
}

const LOGOS_INFO = import.meta.glob("../DocHubAssets/VendoInfoLogo/*.png", {
  eager: true,
  import: "default",
});

const LOGOS = import.meta.glob("../DocHubAssets/VendorTileLogo/*.png", {
  eager: true,
  import: "default",
});

function toInfoLogoName(fileName) {
  if (!fileName) return null;

  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return `${fileName}_Info`; // fallback
  const base = fileName.slice(0, dot);
  const ext = fileName.slice(dot);
  return `${base}_Info${ext}`;
}

function getLogoSrc(fileName) {
  const infoName = toInfoLogoName(fileName);
  if (!infoName) return null;

  const key = Object.keys(LOGOS_INFO).find((p) => p.endsWith(`/${infoName}`));
  return key ? LOGOS_INFO[key] : null;
}

const CATEGORY_STYLES = {
  Link: {bg: "#E8F3FF", fg: "#1E3A8A" },
  Miscellaneous: { bg: "#F3F4F6", fg: "#111827" },
  "User Guide": { bg: "#ECFDF5", fg: "#065F46" },
  Diagram: { bg: "#F5F3FF", fg: "#5B21B6" },
};

function clampCategory(cat) {
  if (!cat) return "Miscellaneous";
  const v = String(cat).trim();
  if (CATEGORY_STYLES[v]) return v;
  return "Miscellaneous";
}

function DownloadIcon({ active, onClick }) {
  return (
    <button
      type="button"
      className={`docDlBtn ${active ? "isActive" : ""}`}
      onClick={onClick}
      aria-label="Download document"
      title="Download"
    >
      <svg className="docDlIcon" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ExternalLinkIcon({ onClick }) {
  return (
    <button
      type="button"
      className="docDlBtn"
      onClick={onClick}
      aria-label="Open link"
      title="Open link"
    >
      <svg className="docDlIcon" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 5h5v5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 14 19 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
function VendorDetailsSection() {
  const dummyVendorDetails = {
    aboutTitle: "About",
    aboutText:
      "StarSchema provides modern data products for analytics, measurement, and attribution. Their offerings help teams accelerate insights, standardize reporting, and scale governed access across the organization.",

    categories: ["Health and Life Sciences"],

    products: ["QA", "RA", "DA", "TA", "RA", "QA", "AS"],
    alloyProjects: ["TA", "RA", "QA", "AS", "DA", "QA"],

    support: [
      { label: "Website", value: "https://starschema.com", href: "https://starschema.com" },
      { label: "VDP Distribution List", value: "vdp-starschema@yourcompany.com", href: "" },
      { label: "Vendor Relationship Officers", value: "vro-dh@yourcompany.com", href: "" },
      {
        label: "Confluence Link",
        value: "StarSchema Vendor Page",
        href: "https://confluence.yourcompany.com/display/VENDORS/StarSchema",
      },
    ],

    queries: [
      {
        title: "Get total case count by country",
        description: "Calculates the total number of cases by country, aggregated over time.",
        sql: `SELECT COUNTRY_REGION, SUM(CASES) AS Cases
FROM ECDC_GLOBAL
GROUP BY COUNTRY_REGION;`,
      },
      {
        title: "Change in mobility over time",
        description:
          "Displays the change in visits to places like grocery stores and parks by date, location and location type for a sub-region.",
        sql: `SELECT DATE,
       COUNTRY_REGION,
       PROVINCE_STATE,
       GROCERY_AND_PHARMACY_CHANGE_PERC,
       PARKS_CHANGE_PERC
FROM MOBILITY
WHERE COUNTRY_REGION = 'United States'
ORDER BY DATE DESC;`,
      },
    ],
  };

  const [open, setOpen] = useState(() => new Set()); // expanded queries
  const [copied, setCopied] = useState(null);

  const toggleOpen = (i) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const copyToClipboard = async (text, i) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // ignore
    }
  };

  const Icon = {
    info: (
      <svg className="vendorDetailSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 7h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
    bookmark: (
      <svg className="vendorDetailSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
    grid: (
      <svg className="vendorDetailSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 4h7v7H4V4Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 4h7v7h-7V4Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 13h7v7H4v-7Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 13h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    puzzle: (
      <svg className="vendorDetailSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 3h6v3a2 2 0 1 0 0 4v3h3v6h-3a2 2 0 1 1-4 0H9v-3a2 2 0 1 0 0-4V3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
    mail: (
      <svg className="vendorDetailSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    book: (
      <svg className="vendorDetailSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M18 19H6a2 2 0 0 0-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    ext: (
      <svg className="vendorExtSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14 19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M19 14v5H5V5h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </svg>
    ),
    copy: (
      <svg className="vendorCopySvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path
          d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  // Clamp long text to N lines, only show "Show more" if it actually overflows.
  // Uses ResizeObserver so it works reliably across fonts/layout changes.
  function ExpandableText({ text, collapsedLines = 2 }) {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const ref = useRef(null);

    const measure = () => {
      const el = ref.current;
      if (!el) return;

      // Force collapsed state for measurement
      el.classList.remove("isExpanded");
      el.style.webkitLineClamp = String(collapsedLines);

      // Let layout settle then measure
      const overflow = el.scrollHeight > el.clientHeight + 1;
      setCanExpand(overflow);

      // Restore expanded view if needed
      if (expanded) {
        el.classList.add("isExpanded");
        el.style.webkitLineClamp = "unset";
      }
    };

    useLayoutEffect(() => {
      measure();
      const el = ref.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => measure());
      ro.observe(el);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, collapsedLines, expanded]);

    return (
      <div className="vendorExpandable">
        <div
          ref={ref}
          className={`vendorExpandableText ${expanded ? "isExpanded" : ""}`}
          style={{ WebkitLineClamp: expanded ? "unset" : collapsedLines }}
        >
          {text}
        </div>

        {canExpand && (
          <button
            type="button"
            className="vendorExpandableBtn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Show more"}
            <span className={`vendorChevron ${expanded ? "isUp" : ""}`} aria-hidden="true">
              ▾
            </span>
          </button>
        )}
      </div>
    );
  }

  function UsageSqlBox({ sql, expanded, onToggle, copiedToast }) {
    const codeWrapRef = useRef(null);
    const [canExpand, setCanExpand] = useState(false);
    const COLLAPSED_MAX = 140;

    const measure = () => {
      const el = codeWrapRef.current;
      if (!el) return;

      // Force collapsed mode for measurement (otherwise scrollHeight==clientHeight)
      el.style.maxHeight = `${COLLAPSED_MAX}px`;
      el.style.overflow = "hidden";

      const needs = el.scrollHeight > el.clientHeight + 1;
      setCanExpand(needs);

      // Restore current visual state
      if (!needs || expanded) {
        el.style.maxHeight = "none";
        el.style.overflow = "visible";
      }
    };

    useLayoutEffect(() => {
      measure();
      const el = codeWrapRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => measure());
      ro.observe(el);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sql, expanded]);

    return (
      <div className={`vendorCodeBox ${canExpand ? "isCollapsible" : "isAuto"} ${expanded ? "isExpanded" : ""}`}>
        {copiedToast}

        <div
          ref={codeWrapRef}
          className="vendorCodeLines"
          style={{
            maxHeight: !canExpand || expanded ? "none" : `${COLLAPSED_MAX}px`,
            overflow: !canExpand || expanded ? "visible" : "hidden",
          }}
        >
          {renderSql(sql)}
        </div>

        {canExpand && (
          <div className="vendorCodeFooter">
            <button type="button" className="vendorShowMoreBtn" onClick={onToggle} aria-expanded={expanded}>
              {expanded ? "Show less" : "Show more"}
              <span className={`vendorChevron ${expanded ? "isUp" : ""}`} aria-hidden="true">
                ▾
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const renderSql = (sql) => {
    return <pre className="vendorCodePre">{String(sql || "")}</pre>;
  };

  return (
    <section className="vendorDetailsSection" aria-label="Vendor details">
      <div className="vendorDetailsInner">
        <div className="vendorDetailsHeading">Vendor Detail</div>
        {/* About */}
        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.info}</span>
            <div className="vendorDetailTitle">{dummyVendorDetails.aboutTitle}</div>
          </div>
          <div className="vendorDetailBody">
            <div className="vendorDetailText">{dummyVendorDetails.aboutText}</div>
          </div>
        </div>

        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.puzzle}</span>
            <div className="vendorDetailTitle">Parent Company</div>
          </div>
          <div className="vendorDetailBody">
            <div className="vendorDetailText">Vendor Company LLC</div>
          </div>
        </div>

        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.bookmark}</span>
            <div className="vendorDetailTitle">Product Categories</div>
          </div>
          <div className="vendorDetailBody">
            <div className="vendorPills">
              {dummyVendorDetails.categories.map((c) => (
                <span key={c} className="vendorPill">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Data Products */}
        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.grid}</span>
            <div className="vendorDetailTitle">Data Products</div>
          </div>
          <div className="vendorDetailBody">
            <div className="vendorInlineTable" aria-label="Products">
              {dummyVendorDetails.products.map((p, idx) => (
                <span className="vendorInlineItem" key={`${p}-${idx}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Alloy Projects */}
        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.puzzle}</span>
            <div className="vendorDetailTitle">Alloy Projects</div>
          </div>
          <div className="vendorDetailBody">
            <div className="vendorInlineTable" aria-label="Alloy Projects">
              {dummyVendorDetails.alloyProjects.map((p, idx) => (
                <span className="vendorInlineItem" key={`${p}-${idx}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.mail}</span>
            <div className="vendorDetailTitle">Support</div>
          </div>
          <div className="vendorDetailBody">
            <div className="vendorSupportGrid">
              <div className="vendorSupportCol">
                {dummyVendorDetails.support.slice(0, 2).map((s, idx) => (
                  <div className="vendorSupportRow" key={`${s.label}-${idx}`}>
                    <div className="vendorSupportLabel">{s.label}</div>
                    <div className="vendorSupportValue">
                      {s.href ? (
                        <a className="vendorSupportLink" href={s.href} target="_blank" rel="noreferrer">
                          {s.value} {Icon.ext}
                        </a>
                      ) : (
                        s.value
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="vendorSupportCol">
                {dummyVendorDetails.support.slice(2).map((s, idx) => (
                  <div className="vendorSupportRow" key={`${s.label}-${idx + 2}`}>
                    <div className="vendorSupportLabel">{s.label}</div>
                    <div className="vendorSupportValue">
                      {s.href ? (
                        <a className="vendorSupportLink" href={s.href} target="_blank" rel="noreferrer">
                          {s.value} {Icon.ext}
                        </a>
                      ) : (
                        s.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PyPure Queries */}
        <div className="vendorDetailBlock">
          <div className="vendorDetailHead">
            <span className="vendorDetailIcon">{Icon.book}</span>
            <div className="vendorDetailTitle">PyPure Queries</div>
          </div>

          <div className="vendorDetailBody">
            <div className="vendorUsageList">
              {dummyVendorDetails.queries.map((q, i) => {
                const expanded = open.has(i);
                return (
                  <div key={q.title} className="vendorUsageItem">
                    <div className="vendorUsageTitle">{q.title}</div>
                    {/* Long descriptions (e.g., "Change in mobility over time") clamp + expand on demand */}
                    <div className="vendorUsageDesc">
                      <ExpandableText text={q.description} collapsedLines={2} />
                    </div>

                    <div className="vendorUsageSqlWrap" role="region" aria-label={`Query example ${i + 1}`}
                    >
                      <button
                        type="button"
                        className="vendorCopyBtn"
                        onClick={() => copyToClipboard(q.sql, i)}
                        title="Copy"
                        aria-label="Copy query"
                      >
                        {Icon.copy}
                      </button>

                      <UsageSqlBox
                        sql={q.sql}
                        expanded={expanded}
                        onToggle={() => toggleOpen(i)}
                        copiedToast={copied === i ? <div className="vendorCopiedToast">Copied</div> : null}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function SortIcon({ dir }) {
  return (
    <span className="docSortIcon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 10l4-4 4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={dir === "asc" ? 1 : 0.25}
        />
        <path
          d="M8 14l4 4 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={dir === "desc" ? 1 : 0.25}
        />
      </svg>
    </span>
  );
}

/**
 * docs shape expected:
 * {
 *   DOC_ID, DOC_NAME, DOC_DESC, DOC_TYPE, DOC_FORMAT, DOC_SIZE, DOC_UP_DATA
 * }
 */
function DocumentsTable({ docs }) {
  const rows = Array.isArray(docs) ? docs : [];

  const [searchText, setSearchText] = useState("");
  const [uploadDateFrom, setUploadDateFrom] = useState(""); // YYYY-MM-DD
  const [uploadDateTo, setUploadDateTo] = useState(""); // YYYY-MM-DD
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [selected, setSelected] = useState(() => new Set());
  const [downloaded, setDownloaded] = useState(() => new Set());

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [page, setPage] = useState(1);

  const [sortKey, setSortKey] = useState("DOC_UP_DATA");
  const [sortDir, setSortDir] = useState("desc");

  const filteredRows = useMemo(() => {
    const q = String(searchText || "").trim().toLowerCase();
    const hasQuery = q.length > 0;

    const fromMs = uploadDateFrom ? new Date(`${uploadDateFrom}T00:00:00`).getTime() : null;
    const toMs = uploadDateTo ? new Date(`${uploadDateTo}T23:59:59`).getTime() : null;

    return rows.filter((r) => {
      // search by name + desc
      if (hasQuery) {
        const n = String(r?.DOC_NAME || "").toLowerCase();
        const d = String(r?.DOC_DESC || "").toLowerCase();
        if (!n.includes(q) && !d.includes(q)) return false;
      }

      // filter by upload date (DOC_UP_DATA)
      if (fromMs != null || toMs != null) {
        const raw = String(r?.DOC_UP_DATA || "");
        const docMs = Date.parse(raw);
        if (!Number.isFinite(docMs)) return false;
        if (fromMs != null && docMs < fromMs) return false;
        if (toMs != null && docMs > toMs) return false;
      }

      return true;
    });
  }, [rows, searchText, uploadDateFrom, uploadDateTo]);

  const totalRows = filteredRows.length;

  const sortableKeys = new Set(["DOC_NAME", "DOC_FORMAT", "DOC_SIZE", "DOC_UP_DATA"]);
  const headerMeta = [
    { key: "DOC_ID", label: "Asset ID", sortable: false },
    { key: "DOC_NAME", label: "Asset Name", sortable: true },
    { key: "DOC_DESC", label: "Description", sortable: false },
    { key: "DOC_TYPE", label: "Content Type", sortable: false },
    { key: "DOC_FORMAT", label: "Format", sortable: true },
    { key: "DOC_SIZE", label: "Size", sortable: true },
    { key: "DOC_UP_DATA", label: "Upload Date", sortable: true },
    { key: "ACTION", label: "Action", sortable: false },
  ];

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];

    if (!sortableKeys.has(sortKey)) return list;

    const getVal = (r) => {
      const v = r?.[sortKey];
      if (v == null) return "";
      return String(v);
    };

    list.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);

      // try date sort for Updated
      if (sortKey === "DOC_UP_DATA") {
        const ad = Date.parse(av);
        const bd = Date.parse(bv);
        const aNum = Number.isFinite(ad) ? ad : 0;
        const bNum = Number.isFinite(bd) ? bd : 0;
        return sortDir === "asc" ? aNum - bNum : bNum - aNum;
      }

      // try numeric sort for Size if values look numeric-ish
      if (sortKey === "DOC_SIZE") {
        const aNum = parseFloat(av.replace(/[^\d.]/g, "")) || 0;
        const bNum = parseFloat(bv.replace(/[^\d.]/g, "")) || 0;
        return sortDir === "asc" ? aNum - bNum : bNum - aNum;
      }

      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [filteredRows, sortKey, sortDir]);

  // If user changes filters/search, reset to first page (simple UX)
  useEffect(() => {
    setPage(1);
  }, [searchText, uploadDateFrom, uploadDateTo]);

  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndexExclusive = Math.min(startIndex + rowsPerPage, totalRows);

  const pageRows = useMemo(
    () => sortedRows.slice(startIndex, endIndexExclusive),
    [sortedRows, startIndex, endIndexExclusive]
  );

  const rangeLabel =
    totalRows === 0 ? "0–0 of 0" : `${startIndex + 1}–${endIndexExclusive} of ${totalRows}`;

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(String(r.DOC_ID)));

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageRows.forEach((r) => next.delete(String(r.DOC_ID)));
      } else {
        pageRows.forEach((r) => next.add(String(r.DOC_ID)));
      }
      return next;
    });
  };

  const toggleRow = (docId) => {
    const id = String(docId);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onHeaderSort = (key) => {
    if (!sortableKeys.has(key)) return;
    setPage(1);
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const clickDownload = (docId) => {
    const id = String(docId);
    setDownloaded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // later: trigger real download here
  };

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchText, uploadDateFrom, uploadDateTo]);

  const exportToExcel = () => {
    // Export the current filtered+sorted rows (not just the current page)
    const exportRows = sortedRows;

    const cols = [
      { key: "DOC_ID", label: "Asset ID" },
      { key: "DOC_NAME", label: "Asset Name" },
      { key: "DOC_DESC", label: "Description" },
      { key: "DOC_TYPE", label: "Content Type" },
      { key: "DOC_FORMAT", label: "Format" },
      { key: "DOC_SIZE", label: "Size" },
      { key: "DOC_UP_DATA", label: "Upload Date" },
    ];

    const escapeHtml = (v) =>
      String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const thead = `<tr>${cols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr>`;
    const tbody = exportRows
      .map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(r?.[c.key])}</td>`).join("")}</tr>`)
      .join("");

    const html = `\ufeff<html><head><meta charset="UTF-8" /></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documents_and_links.xls";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const formatShortDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return "";
    const parts = String(yyyyMmDd).split("-");
    if (parts.length !== 3) return yyyyMmDd;
    const [y, m, d] = parts;
    return `${m}/${d}/${y}`;
  };

  const dateRangeText = useMemo(() => {
    const from = formatShortDate(uploadDateFrom);
    const to = formatShortDate(uploadDateTo);
    if (!from && !to) return "mm/dd/yyyy - mm/dd/yyyy";
    if (from && !to) return `${from} - mm/dd/yyyy`;
    if (!from && to) return `mm/dd/yyyy - ${to}`;
    return `${from} - ${to}`;
  }, [uploadDateFrom, uploadDateTo]);

  const getLikelyUrl = (r) => {
    const direct = r?.DOC_URL || r?.DOC_LINK || r?.URL || r?.LINK;
    const tryFields = [direct, r?.DOC_NAME, r?.DOC_DESC, r?.DOC_FORMAT];
    for (const v of tryFields) {
      const s = String(v || "");
      const m = s.match(/https?:\/\/[^\s)\]]+/i);
      if (m && m[0]) return m[0];
    }
    return "";
  };

  const isLinkAsset = (r) => {
    const t = String(r?.DOC_TYPE || "").toLowerCase();
    const f = String(r?.DOC_FORMAT || "").toLowerCase();
    const url = getLikelyUrl(r);
    return t === "link" || f === "url" || Boolean(url);
  };

  const openLink = (r) => {
    const url = getLikelyUrl(r);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // compact page buttons: 1 2 ... last (enough for your UI)
  const pageButtons = useMemo(() => {
    const buttons = [];
    const last = totalPages;

    if (last <= 6) {
      for (let i = 1; i <= last; i++) buttons.push(i);
      return buttons;
    }

    buttons.push(1);
    if (safePage > 3) buttons.push("…");
    for (let i = Math.max(2, safePage - 1); i <= Math.min(last - 1, safePage + 1); i++) {
      buttons.push(i);
    }
    if (safePage < last - 2) buttons.push("…");
    buttons.push(last);

    return buttons;
  }, [totalPages, safePage]);

  return (
    <section className="vendorDocsSection">
      <div className="docTableWrap">
        <div className="docTableTitleRow">
          <div className="docTableHeading">
            <div className="docTableTitle">Documents &amp; Links</div>
            <div className="docTableCount">{totalRows} Items</div>
          </div>

          <div className="docTableControls" aria-label="Documents and links controls">
            <div className="docDateWrap">
              <button
                type="button"
                className="docDateControl"
                aria-label="Upload Date Range"
                onClick={() => setIsDateOpen((v) => !v)}
              >
              <svg className="docDateIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 3v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 9h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
                <span className="docDatePillText">Upload Date</span>
              </button>

              {isDateOpen && (
                <div className="docDatePopover" role="dialog" aria-label="Select upload date range">
                  <div className="docDatePopoverRow">
                    <label className="docDatePopoverLabel">From</label>
                    <input
                      type="date"
                      className="docDateInput"
                      value={uploadDateFrom}
                      onChange={(e) => setUploadDateFrom(e.target.value)}
                      aria-label="Upload date from"
                    />
                  </div>
                  <div className="docDatePopoverRow">
                    <label className="docDatePopoverLabel">To</label>
                    <input
                      type="date"
                      className="docDateInput"
                      value={uploadDateTo}
                      onChange={(e) => setUploadDateTo(e.target.value)}
                      aria-label="Upload date to"
                    />
                  </div>

                  <div className="docDatePopoverActions">
                    <button
                      type="button"
                      className="docDateClearBtn"
                      onClick={() => {
                        setUploadDateFrom("");
                        setUploadDateTo("");
                        setIsDateOpen(false);
                      }}
                    >
                      Clear
                    </button>
                    <button type="button" className="docDateApplyBtn" onClick={() => setIsDateOpen(false)}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="docSearchControl">
              <input
                type="search"
                className="docSearchInput"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                aria-label="Search documents by name or description"
              />
            </div>

            <button
              type="button"
              className="docExportBtn"
              onClick={exportToExcel}
              aria-label="Export to Excel"
              title="Export"
            >
              <svg className="docExportIcon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="docTableCard">
          <table className="docTable" role="table" aria-label="Documents table">
            <colgroup>
              <col style={{ width: "46px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "320px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "70px" }} />
            </colgroup>

            <thead>
              <tr className="docHeadRow">
                <th className="docHeadCell docHeadCheck">
                  <input
                    type="checkbox"
                    className="docCheck"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label="Select all rows on page"
                  />
                </th>

                {headerMeta.map((h) => {
                  if (h.key === "ACTION") {
                    return (
                      <th key={h.key} className="docHeadCell docHeadAction">
                        <span className="docHeadIcon">{h.icon}</span>
                        {h.label}
                      </th>
                    );
                  }

                  return (
                    <th
                      key={h.key}
                      className={`docHeadCell ${h.sortable ? "isSortable" : ""}`}
                      onClick={() => onHeaderSort(h.key)}
                      role={h.sortable ? "button" : undefined}
                      tabIndex={h.sortable ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (!h.sortable) return;
                        if (e.key === "Enter" || e.key === " ") onHeaderSort(h.key);
                      }}
                      aria-sort={
                        sortKey === h.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                      }
                    >
                      <span className="docHeadIcon">{h.icon}</span>
                      <span className="docHeadLabel">{h.label}</span>
                      {h.sortable && <SortIcon dir={sortKey === h.key ? sortDir : undefined} />}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {pageRows.length === 0 ? (
                <tr className="docRow">
                  <td className="docCell" colSpan={9}>
                    <div className="docEmpty">No documents</div>
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const id = String(r.DOC_ID);
                  const isSelected = selected.has(id);
                  const cat = clampCategory(r.DOC_TYPE);
                  const catStyle = CATEGORY_STYLES[cat];
                  const linkAsset = isLinkAsset(r);

                  return (
                    <tr
                      key={id}
                      className={`docRow ${isSelected ? "isSelected" : ""}`}
                      onClick={(e) => {
                        // don’t toggle if clicking download button
                        if (e.target.closest(".docDlBtn")) return;
                        if (e.target.closest("a")) return;
                        toggleRow(id);
                      }}
                    >
                      <td className="docCell docCellCheck" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="docCheck"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label={`Select ${r.DOC_NAME || "document"}`}
                        />
                      </td>

                      <td className="docCell docCellId" title={r.DOC_ID || ""}>
                        {r.DOC_ID || ""}
                      </td>

                      <td className="docCell docCellName" title={r.DOC_NAME || ""}>
                        {r.DOC_NAME || ""}
                      </td>

                      <td className="docCell docCellDesc" title={r.DOC_DESC || ""}>
                        {r.DOC_DESC || ""}
                      </td>

                      <td className="docCell docCellCat">
                        <span
                          className="docBadge"
                          style={{ background: catStyle.bg }}
                          title={cat}
                        >
                          {cat}
                        </span>
                      </td>

                      <td className="docCell docCellFmt" title={r.DOC_FORMAT || ""}>
                        {r.DOC_FORMAT || ""}
                      </td>

                      <td className="docCell docCellSize" title={r.DOC_SIZE || ""}>
                        {r.DOC_SIZE || ""}
                      </td>

                      <td className="docCell docCellUpdated" title={r.DOC_UP_DATA || ""}>
                        {r.DOC_UP_DATA || ""}
                      </td>

                      <td className="docCell docCellAction" onClick={(e) => e.stopPropagation()}>
                        {linkAsset ? (
                          <ExternalLinkIcon onClick={() => openLink(r)} />
                        ) : (
                          <DownloadIcon active={downloaded.has(id)} onClick={() => clickDownload(id)} />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="docFooter">
            <div className="docFooterLeft">
              <span className="docFooterLabel">Rows per page</span>
              <select
                className="docRowsSelect"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="docRange">{rangeLabel}</span>
            </div>

            <div className="docFooterRight">
              <button className="docNavBtn" onClick={() => goTo(1)} disabled={safePage === 1} aria-label="First page">
                «
              </button>
              <button className="docNavBtn" onClick={() => goTo(safePage - 1)} disabled={safePage === 1} aria-label="Previous page">
                ‹
              </button>

              {pageButtons.map((p, idx) =>
                p === "…" ? (
                  <span key={`dots-${idx}`} className="docDots">…</span>
                ) : (
                  <button
                    key={p}
                    className={`docPageBtn ${p === safePage ? "isActive" : ""}`}
                    onClick={() => goTo(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button className="docNavBtn" onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} aria-label="Next page">
                ›
              </button>
              <button className="docNavBtn" onClick={() => goTo(totalPages)} disabled={safePage === totalPages} aria-label="Last page">
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Vendor() {
  const { id } = useParams();
  const location = useLocation();

  const [vendor, setVendor] = useState(location.state?.vendor || null);
  const [loading, setLoading] = useState(!location.state?.vendor);
  const [error, setError] = useState("");

  // demo docs for UI (replace later with real API)
  const [docs, setDocs] = useState(() => {
    // You can start empty: []
    return [
      {
        DOC_ID: "DOC-0001",
        DOC_NAME: "Vendor Access Guide",
        DOC_DESC: "How to request access, permissions, and entitlement setup.",
        DOC_TYPE: "User Guide",
        DOC_FORMAT: "PDF",
        DOC_SIZE: "2.4 MB",
        DOC_UP_DATA: "2026-02-03",
      },
      {
        DOC_ID: "DOC-0002",
        DOC_NAME: "Data Methodology Notes",
        DOC_DESC: "Field definitions, mapping logic, and calculation assumptions.",
        DOC_TYPE: "Methodology",
        DOC_FORMAT: "DOCX",
        DOC_SIZE: "980 KB",
        DOC_UP_DATA: "2026-01-20",
      },
      {
        DOC_ID: "DOC-0003",
        DOC_NAME: "Vendor Reference Link",
        DOC_DESC: "Official documentation landing page and release notes link.",
        DOC_TYPE: "Link",
        DOC_FORMAT: "URL",
        DOC_SIZE: "—",
        DOC_UP_DATA: "2026-01-05",
      },
    ];
  });

  useEffect(() => {
    if (vendor) return;

    (async () => {
      try {
        const res = await fetch("/api/vendors");
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const found = data.find(
          (v) => String(v.slug || "") === String(id) || String(v.VENDOR_ID || "") === String(id)
        );

        if (!found) throw new Error("Vendor not found");
        setVendor(found);
        setError("");
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, vendor]);

  const vendorName =
    vendor?.VENDOR_TILE_NAME ||
    vendor?.VENDOR_NAME ||
    vendor?.name ||
    vendor?.NAME ||
    vendor?.vendor_name ||
    vendor?.VENDOR_DISPLAY_NAME ||
    "";

  const vendorDesc =
    vendor?.VENDOR_TILE_DESC ||
    vendor?.VENDOR_DESC ||
    vendor?.DESCRIPTION ||
    vendor?.tagline ||
    vendor?.desc ||
    vendor?.vendor_desc ||
    vendor?.VENDOR_DESCRIPTION ||
    "";

  const websiteUrl =
    vendor?.WEBSITE || vendor?.website || vendor?.URL || vendor?.url || "https://starschema.com";

  const confluenceUrl =
    vendor?.CONFLUENCE_PAGE ||
    vendor?.CONFLUENCE_LINK ||
    vendor?.confluence ||
    vendor?.confluence_url ||
    "https://confluence.yourcompany.com";

  const safeTextColor = (() => {
    const c = String(vendor?.VENDOR_NAME_TEXT_COLOR || "").trim().toLowerCase();
    if (!c) return "#0a0a0a";
    // prevent white-on-white (most common reason the text “disappears”)
    if (c === "#fff" || c === "#ffffff" || c === "white") return "#0a0a0a";
    return c;
  })();

  const logoSrc = useMemo(() => getLogoSrc(vendor?.VENDOR_TILE_LOGO), [vendor]);

  if (loading) return <div className="vendorPageWrap">Loading…</div>;
  if (error) return <div className="vendorPageWrap">Failed to load: {error}</div>;

  return (
    <div className="vendorPageWrap">
      <section className="vendorInfoSection" style={{ "--vendorText": safeTextColor }}>
        <VendorInfoDotsFx />

        <div className="vendorInfoLeft">
          {(() => {
            const { base, accent } = splitVendorNameHalf(vendorName);
            const accentColor = accentColorFromName(vendorName);
            return (
              <h1 className="vendorInfoTitle" style={{ "--vendorNameAccent": accentColor }}>
                <span className="vendorNameBase">{base}</span>
                <span className="vendorNameAccent">{accent}</span>
              </h1>
            );
          })()}
          <p className="vendorInfoDesc">{vendorDesc}</p>
        </div>

        <div className="vendorInfoRight">
          {logoSrc && <img className="vendorInfoLogo" src={logoSrc} alt={`${vendorName} logo`} />}
        </div>


        <div className="vendorInfoButtons" aria-label="Vendor quick links">
          <a className="vendorInfoBtn" href={websiteUrl} target="_blank" rel="noreferrer">Website</a>
          <a className="vendorInfoBtn" href={confluenceUrl} target="_blank" rel="noreferrer">Confluence Page</a>
        </div>

      </section>
      <VendorDetailsSection />
      <DocumentsTable docs={docs} />
      <Footer />
    </div>
  );
}