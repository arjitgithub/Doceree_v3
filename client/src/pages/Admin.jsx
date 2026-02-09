import React, { useEffect, useMemo, useRef, useState } from "react";

const VENDORS = [
  { vendorGuid: "v-001", vendorName: "Snowflake", vendorTaxonomy: "Data Platform", vendorDesc: "" },
  { vendorGuid: "v-002", vendorName: "Cisco", vendorTaxonomy: "Networking", vendorDesc: "" },
  { vendorGuid: "v-003", vendorName: "Okta", vendorTaxonomy: "Identity", vendorDesc: "" },
];

const TABS = [
  { key: "links", label: "Links" },
  { key: "diagrams", label: "Diagrams" },
  { key: "userguides", label: "User Guides" },
  { key: "misc", label: "Misc" },
];

function makeId() {
  return `a_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.addEventListener(
      "load",
      () => {
        s.setAttribute("data-loaded", "true");
        resolve();
      },
      { once: true }
    );
    s.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.body.appendChild(s);
  });
}

export default function Admin() {
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);

  const [vendors, setVendors] = useState(VENDORS);
  const [selectedVendorGuid, setSelectedVendorGuid] = useState(VENDORS[0].vendorGuid);

  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.vendorGuid === selectedVendorGuid) ?? vendors[0];
  }, [selectedVendorGuid, vendors]);

  const [activeTab, setActiveTab] = useState("links");

  const [assetsByVendor, setAssetsByVendor] = useState(() => {
    const seed = {};
    for (const v of VENDORS) seed[v.vendorGuid] = { links: [], diagrams: [], userguides: [], misc: [] };
    return seed;
  });

  // Vendor form
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [vendorMode, setVendorMode] = useState("add");
  const [vendorName, setVendorName] = useState("");
  const [vendorTaxonomy, setVendorTaxonomy] = useState("");
  const [vendorDesc, setVendorDesc] = useState("");

  // Validation errors
  const [vendorErrors, setVendorErrors] = useState({});
  const [assetErrors, setAssetErrors] = useState({});

  // Asset form
  const [mode, setMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [assetDesc, setAssetDesc] = useState("");

  const isLinksTab = activeTab === "links";

  const currentList = useMemo(() => {
    return assetsByVendor[selectedVendorGuid]?.[activeTab] ?? [];
  }, [assetsByVendor, selectedVendorGuid, activeTab]);

  // Vanta background effect (TRUNK) - runs on a transparent overlay so the existing gradient remains visible.
  useEffect(() => {
    let cancelled = false;

    async function initVanta() {
      if (!vantaRef.current) return;

      // Clean up any previous instance
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch {
          // ignore
        }
        vantaEffectRef.current = null;
      }

      // These should exist in client/public so they can be loaded from "/..."
      // If your build has them bundled under a different name (e.g. vanta.dots.min.js), we fall back to that.
      await loadScriptOnce("/p5.min.js").catch(() => {});
      await loadScriptOnce("/vanta.trunk.min.js").catch(() => loadScriptOnce("/vanta.dots.min.js"));

      if (cancelled) return;
      if (!window.VANTA || typeof window.VANTA.TRUNK !== "function") return;

      vantaEffectRef.current = window.VANTA.TRUNK({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x952044,
        // Keep the existing CSS gradient visible underneath.
        backgroundAlpha: 0.0,
        spacing: 10.0,
        chaos: 5.0,
      });
    }

    initVanta().catch(() => {
      // silently ignore if scripts are missing
    });

    return () => {
      cancelled = true;
      if (vantaEffectRef.current) {
        try {
          vantaEffectRef.current.destroy();
        } catch {
          // ignore
        }
        vantaEffectRef.current = null;
      }
    };
  }, []);

  function resetAssetForm() {
    setMode("add");
    setEditingId(null);
    setTitle("");
    setUrl("");
    setFile(null);
    setAssetDesc("");
    setAssetErrors({});
  }

  function resetVendorForm() {
    setVendorFormOpen(false);
    setVendorMode("add");
    setVendorName("");
    setVendorTaxonomy("");
    setVendorDesc("");
    setVendorErrors({});
  }

  function onOpenAddVendor() {
    setVendorMode("add");
    setVendorName("");
    setVendorTaxonomy("");
    setVendorDesc("");
    setVendorErrors({});
    setVendorFormOpen(true);
  }

  function onOpenEditVendor() {
    setVendorMode("edit");
    setVendorName(selectedVendor?.vendorName ?? "");
    setVendorTaxonomy(selectedVendor?.vendorTaxonomy ?? "");
    setVendorDesc(selectedVendor?.vendorDesc ?? "");
    setVendorErrors({});
    setVendorFormOpen(true);
  }

  function validateVendorForm() {
    const e = {};
    if (!vendorName.trim()) e.vendorName = "Name is required.";
    if (!vendorDesc.trim()) e.vendorDesc = "Vendor Description is required.";
    setVendorErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmitVendor(e) {
    e.preventDefault();
    if (!validateVendorForm()) return;

    if (vendorMode === "add") {
      const newGuid = `v_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      const newVendor = {
        vendorGuid: newGuid,
        vendorName: vendorName.trim(),
        vendorTaxonomy: vendorTaxonomy.trim(),
        vendorDesc: vendorDesc.trim(),
      };

      setVendors((prev) => [newVendor, ...prev]);
      setAssetsByVendor((prev) => {
        const copy = structuredClone(prev);
        copy[newGuid] = { links: [], diagrams: [], userguides: [], misc: [] };
        return copy;
      });
      setSelectedVendorGuid(newGuid);
      resetVendorForm();
      return;
    }

    setVendors((prev) =>
      prev.map((v) =>
        v.vendorGuid !== selectedVendorGuid
          ? v
          : {
              ...v,
              vendorName: vendorName.trim(),
              vendorTaxonomy: vendorTaxonomy.trim(),
              vendorDesc: vendorDesc.trim(),
            }
      )
    );
    resetVendorForm();
  }

  function validateAssetForm() {
    const e = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!assetDesc.trim()) e.assetDesc = "Asset Description is required.";
    if (assetDesc.trim().length > 200) e.assetDesc = "Asset Description max length is 200 characters.";
    if (isLinksTab) {
      if (!url.trim()) e.url = "URL is required.";
    } else {
      if (!file) e.file = "Upload is required.";
    }
    setAssetErrors(e);
    return Object.keys(e).length === 0;
  }

  function onClickEditAsset(row) {
    setMode("edit");
    setEditingId(row.assetId);
    setTitle(row.title || "");
    setAssetDesc(row.assetDesc || "");
    if (isLinksTab) {
      setUrl(row.url || "");
      setFile(null);
    } else {
      setFile(null);
      setUrl("");
    }
    setAssetErrors({});
  }

  function onClickDeleteAsset(row) {
    setAssetsByVendor((prev) => {
      const copy = structuredClone(prev);
      copy[selectedVendorGuid][activeTab] = copy[selectedVendorGuid][activeTab].filter((x) => x.assetId !== row.assetId);
      return copy;
    });

    if (editingId && row.assetId === editingId) resetAssetForm();
  }

  function onSubmitAsset(e) {
    e.preventDefault();
    if (!validateAssetForm()) return;

    if (mode === "add") {
      const newRow = isLinksTab
        ? {
            assetId: makeId(),
            title: title.trim(),
            url: url.trim(),
            assetDesc: assetDesc.trim(),
            updatedAt: new Date().toISOString(),
          }
        : {
            assetId: makeId(),
            title: title.trim(),
            fileName: file?.name ?? "file",
            assetDesc: assetDesc.trim(),
            updatedAt: new Date().toISOString(),
          };

      setAssetsByVendor((prev) => {
        const copy = structuredClone(prev);
        copy[selectedVendorGuid][activeTab].unshift(newRow);
        return copy;
      });

      resetAssetForm();
      return;
    }

    setAssetsByVendor((prev) => {
      const copy = structuredClone(prev);
      copy[selectedVendorGuid][activeTab] = copy[selectedVendorGuid][activeTab].map((x) => {
        if (x.assetId !== editingId) return x;

        if (isLinksTab) {
          return {
            ...x,
            title: title.trim(),
            url: url.trim(),
            assetDesc: assetDesc.trim(),
            updatedAt: new Date().toISOString(),
          };
        }

        return {
          ...x,
          title: title.trim(),
          fileName: file ? file.name : x.fileName,
          assetDesc: assetDesc.trim(),
          updatedAt: new Date().toISOString(),
        };
      });
      return copy;
    });

    resetAssetForm();
  }

  return (
    <div className="adminPage">
      <div ref={vantaRef} id="admin-vanta" className="vantaLayer" aria-hidden="true" />

      <div className="pageTitle">Vendor Information Editor</div>

      <div className="adminShell">
        {/* Vendor Details */}
        <div className="adminSection">
          <div className="sectionHeaderRow">
            <div className="sectionTitle">Vendor Details</div>
            <div className="sectionActions">
              <button className="btnSecondary" type="button" onClick={onOpenEditVendor}>
                Edit Vendor
              </button>
              <button className="btnPrimary" type="button" onClick={onOpenAddVendor}>
                + Add Vendor
              </button>
            </div>
          </div>

          <div className="vendorDetailsLayout">
            <div className="colStack">
              <div>
                <div className="fieldRow compact">
                  <div className="fieldLabel">Vendor:</div>
                  <div className="fieldControl">
                    <select
                      className="fieldInput"
                      value={selectedVendorGuid}
                      onChange={(e) => {
                        setSelectedVendorGuid(e.target.value);
                        resetAssetForm();
                        resetVendorForm();
                      }}
                    >
                      {vendors.map((v) => (
                        <option key={v.vendorGuid} value={v.vendorGuid}>
                          {v.vendorName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="fieldTick">✓</div>
                </div>
              </div>

              <div>
                <div className="fieldRow compact">
                  <div className="fieldLabel">Vendor GUID:</div>
                  <div className="fieldControl">
                    <input className="fieldInput" placeholder="v-001" value={selectedVendor.vendorGuid || ""} readOnly />
                  </div>
                </div>
              </div>

              <div>
                <div className="fieldRow compact">
                  <div className="fieldLabel">Product Categories:</div>
                  <div className="fieldControl">
                    <input className="fieldInput" placeholder="e.g. Category" value={selectedVendor.vendorTaxonomy || ""} readOnly />
                  </div>
                </div>
              </div>
            </div>

            <div className="fieldRow descBox vendorDescRow">
              <div className="fieldLabel">Vendor Description:</div>
              <div className="fieldControl">
                <textarea className="fieldTextarea" placeholder="Description" value={selectedVendor.vendorDesc || ""} readOnly />
              </div>
            </div>
          </div>

          {vendorFormOpen && (
            <div className="inlineForm">
              <div className="sectionTitleSmall">{vendorMode === "edit" ? "Edit Vendor" : "Add Vendor"}</div>

              <form onSubmit={onSubmitVendor} className="formStack">
                <div>
                  <div className="fieldRow compact">
                    <div className="fieldLabel">Name:</div>
                    <div className="fieldControl">
                      <input
                        className={`fieldInput ${vendorErrors.vendorName ? "error" : ""}`}
                        placeholder="Name"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                      />
                    </div>
                  </div>
                  {vendorErrors.vendorName && <div className="errorText">{vendorErrors.vendorName}</div>}
                </div>

                <div>
                  <div className="fieldRow compact">
                    <div className="fieldLabel">Product Categories:</div>
                    <div className="fieldControl">
                      <input
                        className="fieldInput"
                        placeholder="Category"
                        value={vendorTaxonomy}
                        onChange={(e) => setVendorTaxonomy(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="fieldRow descBox">
                    <div className="fieldLabel">Vendor Description:</div>
                    <div className="fieldControl">
                      <textarea
                        className={`fieldTextarea ${vendorErrors.vendorDesc ? "error" : ""}`}
                        placeholder="Description"
                        value={vendorDesc}
                        onChange={(e) => setVendorDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  {vendorErrors.vendorDesc && <div className="errorText">{vendorErrors.vendorDesc}</div>}
                </div>

                <div className="formActions">
                  <button className="btnSecondary" type="button" onClick={resetVendorForm}>
                    Cancel
                  </button>
                  <button className="btnPrimary" type="submit">
                    {vendorMode === "edit" ? "Save Vendor" : "Add Vendor"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Vendor Assets */}
        <div className="adminSection vendorAssetsSection">
          <div className="sectionHeaderRow">
            <div className="sectionTitle">Vendor Assets</div>
          </div>

          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tabBtn ${activeTab === t.key ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(t.key);
                  resetAssetForm();
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Title</th>
                  {isLinksTab ? <th>URL</th> : <th style={{ width: "40%" }}>File Name</th>}
                  {!isLinksTab && <th style={{ width: "20%" }}>Updated</th>}
                  <th style={{ width: "18%" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={isLinksTab ? 3 : 4} className="emptyRow">
                      No assets yet. Use <b>Add Asset</b> below to create one.
                    </td>
                  </tr>
                ) : (
                  currentList.map((row) => (
                    <tr key={row.assetId}>
                      <td>{row.title}</td>

                      {isLinksTab ? (
                        <td className="mono">{row.url}</td>
                      ) : (
                        <>
                          <td className="mono">{row.fileName}</td>
                          <td className="mono">{new Date(row.updatedAt).toLocaleString()}</td>
                        </>
                      )}

                      <td>
                        <div className="rowActions">
                          <button className="btnSmall" type="button" onClick={() => onClickEditAsset(row)}>
                            Edit
                          </button>
                          <button className="btnSmall danger" type="button" onClick={() => onClickDeleteAsset(row)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Asset */}
        <div className="adminSection addAssetSection">
          <div className="sectionHeaderRow">
            <div className="sectionTitle">{mode === "edit" ? "Edit Asset" : "Add Asset"}</div>
          </div>

          <form onSubmit={onSubmitAsset}>
            <div className="addItemLayout">
              <div className="colStack">
                <div>
                  <div className="fieldRow compact">
                    <div className="fieldLabel">Title:</div>
                    <div className="fieldControl">
                      <input
                        className={`fieldInput ${assetErrors.title ? "error" : ""}`}
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  {assetErrors.title && <div className="errorText">{assetErrors.title}</div>}
                </div>

                {isLinksTab ? (
                  <div>
                    <div className="fieldRow compact">
                      <div className="fieldLabel">URL:</div>
                      <div className="fieldControl">
                        <input
                          className={`fieldInput ${assetErrors.url ? "error" : ""}`}
                          placeholder="https://..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    {assetErrors.url && <div className="errorText">{assetErrors.url}</div>}
                  </div>
                ) : (
                  <div>
                    <div className="fieldRow compact">
                      <div className="fieldLabel">Upload:</div>
                      <div className="fieldControl">
                        <input
                          className={`fieldInput ${assetErrors.file ? "error" : ""}`}
                          placeholder="Choose a file"
                          value={file ? file.name : ""}
                          readOnly
                        />
                      </div>
                      <input type="file" className="fileOnly" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    </div>
                    {assetErrors.file && <div className="errorText">{assetErrors.file}</div>}
                  </div>
                )}
              </div>

              <div>
                <div className="fieldRow descBox assetDescRow">
                  <div className="fieldLabel">Asset Description:</div>
                  <div className="fieldControl">
                    <textarea
                      className={`fieldTextarea ${assetErrors.assetDesc ? "error" : ""}`}
                      placeholder="Description"
                      value={assetDesc}
                      maxLength={200}
                      onChange={(e) => setAssetDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="errorText">{assetErrors.assetDesc ? assetErrors.assetDesc : `${assetDesc.length}/200`}</div>
              </div>
            </div>

            <div className="formActions">
              <button className="btnSecondary" type="button" onClick={resetAssetForm}>
                Clear
              </button>
              <button className="btnPrimary" type="submit">
                {mode === "edit" ? "Save Changes" : "Add Asset"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
