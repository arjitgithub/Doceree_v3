import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../DocHubLayoutDesign/vendor.css";

const LOGOS = import.meta.glob("../DocHubAssets/VendorTileLogo/*.png", {
  eager: true,
  import: "default",
});

function getLogoSrc(fileName) {
  if (!fileName) return null;
  const key = Object.keys(LOGOS).find((p) => p.endsWith(`/${fileName}`));
  return key ? LOGOS[key] : null;
}

export default function Vendor() {
  const { id } = useParams();
  const location = useLocation();

  const [vendor, setVendor] = useState(location.state?.vendor || null);
  const [loading, setLoading] = useState(!location.state?.vendor);
  const [error, setError] = useState("");

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

  const vendorName = vendor?.name || vendor?.VENDOR_NAME || "";
  const vendorDesc = vendor?.tagline || vendor?.VENDOR_TILE_DESC || "";
  const logoSrc = useMemo(() => getLogoSrc(vendor?.VENDOR_TILE_LOGO), [vendor]);

  if (loading) return <div className="vendorPageWrap">Loading…</div>;
  if (error) return <div className="vendorPageWrap">Failed to load: {error}</div>;

  return (
  <div className="vendorPageWrap">
    {/* Top 70% vendor info */}
    <section
      className="vendorInfoSection"
      style={{
        "--vendorBg": vendor?.VENDOR_BKG_COLOR || "#F1F5F9",
        "--vendorText": vendor?.VENDOR_NAME_TEXT_COLOR || "#0a0a0a",
      }}
    >
      <div className="vendorInfoLeft">
        <h1 className="vendorInfoTitle">{vendorName}</h1>
        <p className="vendorInfoDesc">{vendorDesc}</p>
      </div>

      <div className="vendorInfoRight">
        {logoSrc && (
          <img
            className="vendorInfoLogo"
            src={logoSrc}
            alt={`${vendorName} logo`}
          />
        )}
      </div>
    </section>

    {/* Bottom 30% section */}
    <section className="vendorSecondarySection">
      <div className="vendorSecondaryInner">
        <div className="vendorSecondaryItem">Alloy Projects</div>
        <div className="vendorSecondaryItem">Documents</div>
        <div className="vendorSecondaryItem">Onboarded Products</div>
      </div>
    </section>
  </div>

  );
}
