import React, { useEffect, useMemo, useRef, useState } from "react";
import VendorCard from "../components/VendorCard.jsx";
import CatalogHeaderPaneImage from "../DocHubAssets/WebAppLogos/CatalogTopGoldmanImage1.png";
import { vendors as VENDOR_DATA } from "../vendor.js";
import { vendors as LOCAL_VENDORS } from "../vendor.js";

const TABS = ["ESG", "Corporate Action", "Company Data"];

const SORT_OPTIONS = [
  { key: "default", label: "Default" },
  { key: "az", label: "Alphabetical (A–Z)" },
  { key: "za", label: "Alphabetical (Z–A)" },
];

export default function Catalog() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendors, setSelectedVendors] = useState(() => new Set());
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState("default");

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

    if (sortKey === "az") {
      list = [...list].sort((a, b) =>
        String(a.VENDOR_NAME || "").localeCompare(String(b.VENDOR_NAME || ""), undefined, { sensitivity: "base" })
      );
    } else if (sortKey === "za") {
      list = [...list].sort((a, b) =>
        String(b.VENDOR_NAME || "").localeCompare(String(a.VENDOR_NAME || ""), undefined, { sensitivity: "base" })
      );
    }

    return list;
  }, [vendors, selectedVendor, selectedVendors, sortKey]);

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
            Resolve <span className="keystoneWord">Keystone</span> Tickets, Streamline user requests
          </div>
          <div className="catalogInfoSub">Acquire access to the vendor user guides</div>
        </div>
      </section>

      <section className="catalogControlsBar">
        <div className="catalogControlsLeft">
          <div className="catalogTabs" role="tablist" aria-label="Catalog categories">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`catalogTab ${activeTab === t ? "isActive" : ""}`}
                onClick={() => setActiveTab(t)}
                aria-selected={activeTab === t}
                role="tab"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="catalogControlsCenter" ref={vendorDropdownRef}>
          <button
            type="button"
            className="vendorSelectButton"
            onClick={() => setVendorDropdownOpen((v) => !v)}
            aria-expanded={vendorDropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="vendorSelectButtonText">{selectedVendorsLabel}</span>
            <span className="vendorSelectChevron" aria-hidden="true">▾</span>
          </button>

          {vendorDropdownOpen && (
            <div className="vendorDropdown" role="listbox" aria-label="Vendor selector">
              <div className="vendorDropdownSearchWrap">
                <input
                  className="vendorDropdownSearch"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendors"
                  type="text"
                />
              </div>

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
            </div>
          )}
        </div>

        <div className="catalogControlsRight" ref={sortRef}>
          <button
            type="button"
            className="sortButton"
            onClick={() => setSortOpen((v) => !v)}
            aria-expanded={sortOpen}
            aria-haspopup="menu"
          >
            <span className="sortIcon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="sortLabel">Sort</span>
          </button>

          {sortOpen && (
            <div className="sortMenu" role="menu" aria-label="Sort options">
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
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="catalogBody">
        <section className="catalogRight">
          {loading && <div className="muted">Loading vendors…</div>}
          {error && <div className="muted">Failed to load: {error}</div>}

          {!loading && !error && (
            <div className="catalogGrid">
              {visibleVendors.map((v) => (
                <VendorCard key={v.VENDOR_ID} vendor={v} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
