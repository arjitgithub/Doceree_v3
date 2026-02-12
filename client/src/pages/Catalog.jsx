  import React, { useEffect, useMemo, useRef, useState } from "react";
  import VendorCard from "../components/VendorCard.jsx";
  import CatalogHeaderPaneImage from "../DocHubAssets/WebAppLogos/CatalogTopGoldmanImage1.png";
  import { vendors as VENDOR_DATA } from "../vendor.js";
  import { vendors as LOCAL_VENDORS } from "../vendor.js";  
  import CatalogHeaderFx from "../components/CatalogHeaderFx.jsx";
  import Footer from "../components/Footer.jsx";

  const SORT_OPTIONS = [
    { key: "default", label: "Default" },
    { key: "asc", label: "Ascending" },
    { key: "desc", label: "Descending" },
  ];

  const VENDORS_PER_PAGE = 18;

  export default function Catalog() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVendor, setSelectedVendor] = useState("");
    const [error, setError] = useState("");
    const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
    const [vendorSearch, setVendorSearch] = useState("");
    const [selectedVendors, setSelectedVendors] = useState(() => new Set());
    const [sortOpen, setSortOpen] = useState(false);
    const [sortKey, setSortKey] = useState("default");

    const [currentPage, setCurrentPage] = useState(1);

    const vendorDropdownRef = useRef(null);
    const sortRef = useRef(null);

    useEffect(() => {
      try {
        setVendors(LOCAL_VENDORS);
        setError("");
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }, []);


    useEffect(() => {
      const onDocClick = (e) => {
        if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target)) {
          setVendorDropdownOpen(false);
        }
        if (sortRef.current && !sortRef.current.contains(e.target)) {
          setSortOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const toggleVendorId = (vendorId) => {
      setSelectedVendor("");
      setSelectedVendors((prev) => {
        const next = new Set(prev);
        if (next.has(vendorId)) next.delete(vendorId);
        else next.add(vendorId);
        return next;
      });
    };

    const filteredVendorsByDropdown = useMemo(() => {
      const q = vendorSearch.trim().toLowerCase();
      if (!q) return vendors;
      return vendors.filter((v) => (v.VENDOR_NAME || v.VENDOR_ID || "").toLowerCase().includes(q));
    }, [vendors, vendorSearch]);

    const visibleVendors = useMemo(() => {
      let list = vendors;

      if (selectedVendor) {
        list = list.filter((v) => v.VENDOR_ID === selectedVendor);
      } else if (selectedVendors.size > 0) {
        list = list.filter((v) => selectedVendors.has(v.VENDOR_ID));
      }

      if (sortKey === "asc") {
        list = [...list].sort((a, b) =>
          String(a.VENDOR_NAME || "").localeCompare(String(b.VENDOR_NAME || ""), undefined, { sensitivity: "base" })
        );
      } else if (sortKey === "desc") {
        list = [...list].sort((a, b) =>
          String(b.VENDOR_NAME || "").localeCompare(String(a.VENDOR_NAME || ""), undefined, { sensitivity: "base" })
        );
      }

      return list;
    }, [vendors, selectedVendor, selectedVendors, sortKey]);

    const totalPages = useMemo(() => {
      return Math.max(1, Math.ceil(visibleVendors.length / VENDORS_PER_PAGE));
    }, [visibleVendors.length]);

    // Keep pagination in bounds when filters change the visible list
    useEffect(() => {
      if (currentPage > totalPages) setCurrentPage(1);
    }, [currentPage, totalPages]);

    // Reset to page 1 when the user changes filtering/sorting
    useEffect(() => {
      setCurrentPage(1);
    }, [selectedVendor, selectedVendors, sortKey]);

    const pagedVendors = useMemo(() => {
      const start = (currentPage - 1) * VENDORS_PER_PAGE;
      return visibleVendors.slice(start, start + VENDORS_PER_PAGE);
    }, [visibleVendors, currentPage]);

    const goToPage = (p) => {
      const next = Math.min(Math.max(1, p), totalPages);
      setCurrentPage(next);
    };

    const pageItems = useMemo(() => {
      // Match screenshot style: 1 2 3 4 5 ... last
      if (totalPages <= 6) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }, [totalPages]);

    const selectedVendorsLabel = useMemo(() => {
      if (selectedVendor) {
        const v = vendors.find((x) => x.VENDOR_ID === selectedVendor);
        return v?.VENDOR_NAME || "Selected vendor";
      }
      const n = selectedVendors.size;
      if (n === 0) return "Select vendors";
      if (n === 1) {
        const vendorId = Array.from(selectedVendors)[0];
        const v = vendors.find((x) => x.VENDOR_ID === vendorId);
        return v?.VENDOR_NAME || "1 selected";
      }
      return `${n} selected`;
    }, [selectedVendor, selectedVendors, vendors]);

    return (
      <div className="catalogFullBleed">
        <section className="catalogHeaderPane">
          <CatalogHeaderFx />
          <div className="LeftPane">
            <div className="catalogLeftPaneHeading1">DocHub&apos;s</div>
            <div className="catalogLeftPaneHeading2">VENDOR.</div>
            <div className="catalogLeftPaneHeading3">CATALOG.</div>
          </div>

          <div className="CatalogHeaderRightPaneImage">
            <img className="CatalogHeaderPaneImage" src={CatalogHeaderPaneImage} alt="Catalog Header" />
          </div>
        </section>

        <section className="catalogInfoBand">
          <div className="catalogInfoBandInner">
            <div className="catalogInfoTitle">
              Explore <span className="documentsWord">Documents</span> , Resolve <span className="keystoneWord">Keystone</span> Tickets, Streamline user requests
            </div>
            <div className="catalogInfoSub">Acquire access to the vendor user guides</div>
          </div>
        </section>

        {/* ===== Top Categories (white background) ===== */}
        <section className="topCategoriesSection">
          <div className="topCategoriesInner">
            <div className="topCategoriesGrid" role="list">
              </div>
          </div>
        

      <div className="catalogControlsBar">
        <div className="catalogControlsInner">
          <div className="catalogVendorCount">{visibleVendors.length} Vendors</div>

        <div className="catalogControlsRightGroup">
          <div className="catalogControlsCenter" ref={vendorDropdownRef}>
            <button
              type="button"
              className="vendorSelectButton"
              onClick={() => setVendorDropdownOpen((v) => !v)}
              aria-expanded={vendorDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="vendorSearchIcon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" />
                  <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="vendorSelectButtonText">{selectedVendorsLabel}</span>
              <span className="vendorSelectChevron" aria-hidden="true">▾</span>
            </button>

            {vendorDropdownOpen && (
              <div className="vendorDropdown" role="listbox" aria-label="Vendor selector">
                <div className="vendorDropdownList">
                  {filteredVendorsByDropdown.map((v) => (
                    <label key={v.VENDOR_ID} className="vendorDropdownRow">
                      <input
                        type="checkbox"
                        checked={selectedVendors.has(v.VENDOR_ID)}
                        onChange={() => toggleVendorId(v.VENDOR_ID)}
                      />
                      <span className="vendorDropdownName">{v.VENDOR_NAME}</span>
                    </label>
                  ))}
                </div>

                <div className="vendorDropdownActions">
                  <button
                    type="button"
                    className="vendorDropdownBtn"
                    onClick={() => {
                      setSelectedVendor("");
                      setSelectedVendors(new Set());
                      setVendorSearch("");
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="vendorDropdownBtn vendorDropdownBtnPrimary"
                    onClick={() => setVendorDropdownOpen(false)}
                  >
                    Search
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="catalogControlsRight" ref={sortRef}>
            <button
              type="button"
              className="sortButton sortButtonOrange"
              onClick={() => setSortOpen((v) => !v)}
              aria-expanded={sortOpen}
              aria-haspopup="menu"
            >
              <span className="sortIcon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 3v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 17l-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="sortLabel">Sort: {SORT_OPTIONS.find((o) => o.key === sortKey)?.label || "Default"}</span>
              <span className="sortChevron" aria-hidden="true">▾</span>
            </button>

            {sortOpen && (
              <div className="sortMenu" role="menu" aria-label="Sort options">
                <div className="sortMenuHeader">Name</div>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`sortMenuItem ${sortKey === opt.key ? "isSelected" : ""}`}
                    onClick={() => {
                      setSortKey(opt.key);
                      setSortOpen(false);
                    }}
                    role="menuitem"
                  >
                    <span className="sortMenuDot" aria-hidden="true">•</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>



        </section>
        <div className="catalogBody">
          <section className="catalogRight">
            {loading && <div className="muted">Loading vendors…</div>}
            {error && <div className="muted">Failed to load: {error}</div>}

            {!loading && !error && (
              <div className="catalogGrid">
                {pagedVendors.map((v) => (
                  <VendorCard key={v.VENDOR_ID} vendor={v} />
                ))}
              </div>
            )}
          </section>
        </div>

        {!loading && !error && totalPages > 1 && (
          <div className="catalogPaginationWrap">
            <nav className="catalogPagination" aria-label="Vendor pagination">
              <button
                type="button"
                className="catalogPageArrow"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                ‹
              </button>

              {pageItems.map((item, idx) => {
                if (item === "ellipsis") {
                  return (
                    <span key={`e-${idx}`} className="catalogEllipsis" aria-hidden="true">
                      …
                    </span>
                  );
                }

                const pageNum = item;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`catalogPageNumber ${isActive ? "isActive" : ""}`}
                    onClick={() => goToPage(pageNum)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="catalogPageArrow"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          </div>
        )}

        <Footer />
      </div>
    );
  }
