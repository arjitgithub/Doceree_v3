import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../DocHubLayoutDesign/vendor.css";

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
  Methodology: { bg: "#FFF7ED", fg: "#9A3412" },
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

  const [selected, setSelected] = useState(() => new Set());
  const [downloaded, setDownloaded] = useState(() => new Set());

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [page, setPage] = useState(1);

  const [sortKey, setSortKey] = useState("DOC_UP_DATA");
  const [sortDir, setSortDir] = useState("desc");

  const totalRows = rows.length;

  const sortableKeys = new Set(["DOC_NAME", "DOC_FORMAT", "DOC_SIZE", "DOC_UP_DATA"]);
  const headerMeta = [
    { key: "DOC_ID", label: "Id", sortable: false },
    { key: "DOC_NAME", label: "Name", sortable: true },
    { key: "DOC_DESC", label: "Description", sortable: false },
    { key: "DOC_TYPE", label: "Category", sortable: false },
    { key: "DOC_FORMAT", label: "Format", sortable: true },
    { key: "DOC_SIZE", label: "Size", sortable: true },
    { key: "DOC_UP_DATA", label: "Updated", sortable: true },
    { key: "ACTION", label: "Action", sortable: false },
  ];

  const sortedRows = useMemo(() => {
    const list = [...rows];

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
  }, [rows, sortKey, sortDir]);

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
          <div className="docTableTitle">Documents</div>
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
                          style={{ background: catStyle.bg, color: catStyle.fg }}
                          title={cat}
                        >
                          {catStyle.emoji} {cat}
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
                        <DownloadIcon
                          active={downloaded.has(id)}
                          onClick={() => clickDownload(id)}
                        />
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
      <section
        className="vendorInfoSection"
        style={{
          "--vendorText": safeTextColor,
        }}
      >
        <div className="vendorInfoLeft">
          <h1 className="vendorInfoTitle">{vendorName}</h1>
          <p className="vendorInfoDesc">{vendorDesc}</p>
        </div>

        <div className="vendorInfoRight">
          {logoSrc && <img className="vendorInfoLogo" src={logoSrc} alt={`${vendorName} logo`} />}
        </div>
      </section>

      <section className="vendorSecondarySection">
        <div className="vendorSecondaryInner">
          <div className="vendorSecondaryItem">Alloy Projects</div>
          <div className="vendorSecondaryItem">Documents</div>
          <div className="vendorSecondaryItem">Onboarded Products</div>
        </div>
      </section>

      <DocumentsTable docs={docs} />
    </div>
  );
}
