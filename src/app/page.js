"use client";

import { useState, useRef } from "react";

const BLUE = "#1a6fc4";

const FEATURES = [
  { slug: "analyze", name: "Analyze" },
  { slug: "optimize", name: "Optimize" },
  { slug: "cms", name: "CMS" },
  { slug: "ecommerce", name: "Ecommerce" },
  { slug: "interactions", name: "Interactions" },
  { slug: "seo", name: "SEO" },
  { slug: "hosting", name: "Hosting" },
  { slug: "localization", name: "Localization" },
];

const SECTION_META = {
  A: { label: "Product title block", desc: "Logo, feature name, tagline" },
  B: { label: "Feature bullets", desc: "3 icon + headline rows" },
  C: { label: "UI screenshot", desc: "Product interface visual" },
  D: { label: "Persona benefits", desc: "Two audience groups" },
  E: { label: "Differentiators", desc: "4 checkmark items" },
  F: { label: "Customer proof", desc: "Stat, quote, attribution" },
  G: { label: "Integrations / export", desc: "Partner logos grid" },
  H: { label: "Logo pond", desc: "Trusted brands footer" },
};

const LANGS = ["French", "German", "Spanish", "Dutch", "Italian", "Portuguese"];

function Toggle({ on, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!on)}
      style={{
        position: "relative", width: 32, height: 18, flexShrink: 0,
        marginLeft: 12, cursor: disabled ? "default" : "pointer",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: on ? BLUE : "#cdd2db",
        borderRadius: 20, transition: "background .2s",
        opacity: disabled ? 0.5 : 1,
      }} />
      <div style={{
        position: "absolute", width: 12, height: 12, background: "#fff",
        borderRadius: "50%", top: 3, left: on ? 17 : 3,
        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </div>
  );
}

function Pill({ status }) {
  const map = {
    approved: { bg: "#e8f7f1", color: "#1a9e6e", border: "#a7dfc8", label: "Approved" },
    edited:   { bg: "#e8f2fc", color: BLUE,       border: "#b5d4f4", label: "Edited" },
    pending:  { bg: "#fef3c7", color: "#b45309",  border: "#fde68a", label: "Needs approval" },
  };
  const s = map[status] || map.approved;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

export default function Page() {
  const [feature, setFeature] = useState(null);
  const [img64, setImg64] = useState(null);
  const [imgMime, setImgMime] = useState("image/png");
  const [imgName, setImgName] = useState(null);
  const [secs, setSecs] = useState({ A:1,B:1,C:1,D:1,E:1,F:1,G:1,H:1 });
  const [proof, setProof] = useState({ stat:"", label:"", quote:"", attr:"" });
  const [intg, setIntg] = useState({ type:"export", tools:"" });
  const [logos, setLogos] = useState("");
  const [doTranslate, setDoTranslate] = useState(false);
  const [lang, setLang] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [approval, setApproval] = useState({});
  const [edits, setEdits] = useState({});
  const [genHTML, setGenHTML] = useState("");
  const [tab, setTab] = useState("brief");
  const fileRef = useRef();

  function handleImg(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgMime(f.type || "image/png"); setImgName(f.name);
    const r = new FileReader();
    r.onload = ev => setImg64(ev.target.result.split(",")[1]);
    r.readAsDataURL(f);
  }

  function applyResult(data) {
    setResult(data);
    setGenHTML(data.html || "");
    const a = {}, ed = {};
    Object.entries(data.sections || {}).forEach(([k, v]) => {
      a[k] = v.needsApproval ? "pending" : "approved";
      ed[k] = v.content;
    });
    setApproval(a); setEdits(ed);
    setPhase("done"); setTab("brief");
  }

  async function generate() {
    if (!feature) { alert("Please select a feature first."); return; }
    setPhase("loading"); setErrorMsg("");

    const active = Object.entries(secs).filter(([,v]) => v).map(([k]) => k);
    const fname = FEATURES.find(f => f.slug === feature)?.name || feature;
    const pairNotes = [];
    if (secs.B && !secs.C) pairNotes.push("C off — B full width.");
    if (!secs.B && secs.C) pairNotes.push("B off — C full width.");
    if (secs.D && !secs.E) pairNotes.push("E off — D 65% centered.");
    if (!secs.D && secs.E) pairNotes.push("D off — E 65% centered.");
    if (secs.F && !secs.G) pairNotes.push("G off — F 65% centered.");
    if (!secs.F && secs.G) pairNotes.push("F off — G 65% centered.");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          featureName: fname,
          activeSections: active,
          proof: secs.F ? proof : null,
          intg: secs.G ? intg : null,
          logos: secs.H ? (logos || null) : null,
          pairNotes,
          img64: secs.C && img64 ? img64 : null,
          imgMime,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Something went wrong");
        setPhase("error");
        return;
      }
      applyResult(data);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
    }
  }

  const allApproved = result && Object.values(approval).every(s => s === "approved");
  const pendingCount = Object.values(approval).filter(s => s !== "approved").length;
  const fname = FEATURES.find(f => f.slug === feature)?.name || "";

  const inputStyle = {
    width: "100%", fontFamily: "inherit", fontSize: 12,
    padding: "6px 8px", border: "1px solid #e0e4ea", borderRadius: 5,
    background: "#fff", color: "#0d1117", outline: "none",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontSize: 13, color: "#0d1117", background: "#f4f5f7", overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 320, background: "#fff", borderRight: "1px solid #e0e4ea", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 46, borderBottom: "1px solid #e0e4ea", flexShrink: 0 }}>
          <svg width="20" height="14" viewBox="0 0 80 56" fill="none">
            <path d="M49.5 0L34.5 39.2L27 17.5H13.5L27 56L34.5 56L49.5 16.8L64.5 56H78L49.5 0Z" fill={BLUE}/>
            <path d="M0 17.5L13.5 56L20.5 37.1L13.5 17.5H0Z" fill={BLUE}/>
          </svg>
          <span style={{ fontWeight: 600, fontSize: 13 }}>One-Pager Generator</span>
          <div style={{ width: 1, height: 13, background: "#e0e4ea", margin: "0 4px" }}/>
          <span style={{ fontSize: 11, color: "#9aa0ad" }}>PMM · Sales</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
          {/* Feature */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aa0ad", marginBottom: 7, display: "block" }}>Feature</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {FEATURES.map(f => (
                <button key={f.slug} onClick={() => setFeature(f.slug)} style={{
                  border: `1.5px solid ${feature === f.slug ? BLUE : "#e0e4ea"}`,
                  background: feature === f.slug ? "#e8f2fc" : "#fff",
                  borderRadius: 6, padding: "7px 9px", cursor: "pointer",
                  textAlign: "left", display: "flex", flexDirection: "column", gap: 1,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: feature === f.slug ? BLUE : "#0d1117" }}>{f.name}</span>
                  <span style={{ fontSize: 10, color: "#9aa0ad", fontFamily: "monospace" }}>/features/{f.slug}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Screenshot */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aa0ad", marginBottom: 7, display: "block" }}>UI Screenshot (Section C)</span>
            <div onClick={() => fileRef.current?.click()} style={{
              border: `1.5px dashed ${img64 ? "#1a9e6e" : "#e0e4ea"}`,
              background: img64 ? "#e8f7f1" : "#fff",
              borderRadius: 6, padding: "12px 10px", textAlign: "center", cursor: "pointer",
            }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg}/>
              <div style={{ fontSize: 16 }}>🖼</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: img64 ? "#1a9e6e" : "#5a6478", marginTop: 3 }}>{imgName || "Drop image or click to upload"}</div>
              <div style={{ fontSize: 11, color: "#9aa0ad", marginTop: 2 }}>{img64 ? "click to change" : "PNG, JPG, Figma export"}</div>
            </div>
          </div>

          {/* Sections */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aa0ad", marginBottom: 7, display: "block" }}>Sections</span>
            {Object.entries(SECTION_META).map(([k, meta]) => (
              <div key={k}>
                <div style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f4f5f7" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{k} · {meta.label}</div>
                    <div style={{ fontSize: 11, color: "#9aa0ad", marginTop: 1 }}>{meta.desc}</div>
                  </div>
                  <Toggle on={!!secs[k]} onChange={v => k !== "A" && setSecs(s => ({ ...s, [k]: v ? 1 : 0 }))} disabled={k === "A"}/>
                </div>
                {k === "F" && secs.F && (
                  <div style={{ margin: "5px 0 3px", padding: "9px 10px", background: "#f4f5f7", borderRadius: 6, border: "1px solid #e0e4ea", display: "flex", flexDirection: "column", gap: 5 }}>
                    {[["Stat (e.g. 56%)", "stat"], ["Stat label", "label"]].map(([lbl, field]) => (
                      <div key={field}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 2 }}>{lbl}</label>
                        <input style={inputStyle} value={proof[field]} onChange={e => setProof(p => ({ ...p, [field]: e.target.value }))} placeholder={lbl}/>
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 2 }}>Pull quote</label>
                      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 48, lineHeight: 1.5 }} value={proof.quote} onChange={e => setProof(p => ({ ...p, quote: e.target.value }))} placeholder="Customer quote..."/>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 2 }}>Name, title, company</label>
                      <input style={inputStyle} value={proof.attr} onChange={e => setProof(p => ({ ...p, attr: e.target.value }))} placeholder="e.g. Kokko Tso, VP Marketing, Acme"/>
                    </div>
                  </div>
                )}
                {k === "G" && secs.G && (
                  <div style={{ margin: "5px 0 3px", padding: "9px 10px", background: "#f4f5f7", borderRadius: 6, border: "1px solid #e0e4ea", display: "flex", flexDirection: "column", gap: 5 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 2 }}>Panel type</label>
                      <select style={{ ...inputStyle }} value={intg.type} onChange={e => setIntg(i => ({ ...i, type: e.target.value }))}>
                        <option value="export">Data export (warehouses)</option>
                        <option value="integrations">Integrations (CRM / MAP)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 2 }}>Tools (comma separated)</label>
                      <input style={inputStyle} value={intg.tools} onChange={e => setIntg(i => ({ ...i, tools: e.target.value }))} placeholder="e.g. MySQL, BigQuery, Snowflake"/>
                    </div>
                  </div>
                )}
                {k === "H" && secs.H && (
                  <div style={{ margin: "5px 0 3px", padding: "9px 10px", background: "#f4f5f7", borderRadius: 6, border: "1px solid #e0e4ea" }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 2 }}>Logos, max 5 (blank = defaults)</label>
                    <input style={inputStyle} value={logos} onChange={e => setLogos(e.target.value)} placeholder="e.g. The Telegraph, Verifone, Okta"/>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Localization */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aa0ad", marginBottom: 7, display: "block" }}>Localization</span>
            <div style={{ display: "flex", alignItems: "center", padding: "7px 0" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>Translate output</div>
                <div style={{ fontSize: 11, color: "#9aa0ad", marginTop: 1 }}>Generate a localized version</div>
              </div>
              <Toggle on={doTranslate} onChange={setDoTranslate}/>
            </div>
            {doTranslate && (
              <div style={{ margin: "5px 0 3px", padding: "9px 10px", background: "#f4f5f7", borderRadius: 6, border: "1px solid #e0e4ea" }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#5a6478", display: "block", marginBottom: 5 }}>Target language</label>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {LANGS.map(l => (
                    <div key={l} onClick={() => setLang(l)} style={{
                      padding: "3px 9px", borderRadius: 20,
                      border: `1.5px solid ${lang === l ? BLUE : "#e0e4ea"}`,
                      fontSize: 11, fontWeight: 500, cursor: "pointer",
                      color: lang === l ? BLUE : "#5a6478",
                      background: lang === l ? "#e8f2fc" : "#fff",
                    }}>{l}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 13px", borderTop: "1px solid #e0e4ea" }}>
          <button onClick={generate} disabled={phase === "loading"} style={{
            width: "100%", padding: 11,
            background: phase === "loading" ? "#9aa0ad" : BLUE,
            color: "#fff", border: "none", borderRadius: 8,
            fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            cursor: phase === "loading" ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {phase === "loading" && (
              <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }}/>
            )}
            <span>{phase === "loading" ? "Generating…" : "Generate one-pager"}</span>
          </button>
        </div>
      </aside>

      {/* ── OUTPUT ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* IDLE */}
        {phase === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, textAlign: "center", padding: 40 }}>
            <div style={{ width: 50, height: 50, background: "#e8f2fc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em" }}>Ready to generate</h2>
            <p style={{ fontSize: 13, color: "#5a6478", maxWidth: 280, lineHeight: 1.6 }}>Select a feature, configure your sections, and hit Generate.</p>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 14, padding: 40 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e8f2fc", borderTopColor: BLUE, borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Generating your one-pager</p>
              <p style={{ fontSize: 13, color: "#5a6478", marginTop: 4 }}>Fetching product page · Searching Drive · Writing copy · Building HTML</p>
              <p style={{ fontSize: 12, color: "#9aa0ad", marginTop: 8 }}>Usually takes 30–60 seconds</p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, padding: 40, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, background: "#fef2f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600 }}>Something went wrong</p>
            <p style={{ fontSize: 12, color: "#5a6478", maxWidth: 360 }}>{errorMsg}</p>
            <button onClick={() => setPhase("idle")} style={{ padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid #e0e4ea", background: "#fff", color: "#5a6478" }}>← Back</button>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && result && (
          <>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", height: 46, borderBottom: "1px solid #e0e4ea", background: "#fff", flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Webflow {result.featureName} One-Pager</div>
                <div style={{ fontSize: 11, color: "#9aa0ad", marginTop: 1 }}>
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {" · "}{Object.keys(result.sections).length} sections
                  {pendingCount > 0 && <span style={{ marginLeft: 7, color: "#b45309", fontWeight: 500 }}>· {pendingCount} pending approval</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setPhase("idle"); setResult(null); }} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid #e0e4ea", background: "#fff", color: "#5a6478" }}>← New</button>
                <button
                  disabled={!allApproved}
                  onClick={() => {
                    const blob = new Blob([genHTML], { type: "text/html" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `webflow-${result.feature}-one-pager.pdf`;
                    a.click();
                  }}
                  style={{ padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: allApproved ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 5, border: "none", background: allApproved ? BLUE : "#9aa0ad", color: "#fff" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {allApproved ? "Download PDF" : `Approve ${pendingCount} to unlock`}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", padding: "0 18px", borderBottom: "1px solid #e0e4ea", background: "#fff", flexShrink: 0 }}>
              {[["brief", "Content brief"], ["review", `Review & approve${pendingCount > 0 ? ` (${pendingCount})` : ""}`], ["preview", "Preview"]].map(([t, l]) => (
                <div key={t} onClick={() => setTab(t)} style={{
                  padding: "8px 11px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  color: tab === t ? BLUE : "#9aa0ad",
                  borderBottom: `2px solid ${tab === t ? BLUE : "transparent"}`,
                  marginBottom: -1,
                }}>{l}</div>
              ))}
            </div>

            {/* Content brief */}
            {tab === "brief" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {Object.entries(result.sections).map(([letter, sec], i, arr) => (
                  <div key={letter} style={{ marginBottom: i === arr.length-1 ? 0 : 16, paddingBottom: i === arr.length-1 ? 0 : 16, borderBottom: i === arr.length-1 ? "none" : "1px solid #f4f5f7" }}>
                    <div style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: BLUE, background: "#e8f2fc", padding: "2px 7px", borderRadius: 20, marginBottom: 6 }}>
                      {letter} · {sec.label}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{ __html: (sec.content || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>") }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Review */}
            {tab === "review" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", borderRadius: 8, border: `1px solid ${pendingCount ? "#fde68a" : "#a7dfc8"}`, background: pendingCount ? "#fef3c7" : "#e8f7f1", marginBottom: 12 }}>
                  {pendingCount > 0
                    ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p style={{ fontSize: 13, color: "#b45309" }}><strong>{pendingCount} section{pendingCount > 1 ? "s" : ""} need approval</strong> — derived content. Review, edit if needed, approve to unlock download.</p></>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a9e6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                        <p style={{ fontSize: 13, color: "#1a9e6e" }}><strong>All approved.</strong> Download is unlocked.</p></>
                  }
                </div>

                {Object.entries(result.sections).map(([letter, sec]) => {
                  const st = approval[letter] || "approved";
                  return (
                    <div key={letter} style={{ border: "1px solid #e0e4ea", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f4f5f7", borderBottom: "1px solid #e0e4ea" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: BLUE }}>{letter} · {sec.label}</span>
                        <Pill status={st}/>
                      </div>
                      <div style={{ padding: "10px 12px", background: "#fff" }}>
                        <textarea
                          style={{ width: "100%", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, padding: "7px 9px", border: "1px solid #e0e4ea", borderRadius: 6, background: "#fff", color: "#0d1117", outline: "none", resize: "vertical", minHeight: 74 }}
                          value={edits[letter] || ""}
                          onChange={e => {
                            setEdits(ed => ({ ...ed, [letter]: e.target.value }));
                            if (approval[letter] !== "approved") setApproval(a => ({ ...a, [letter]: "edited" }));
                          }}
                        />
                        <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                          <button onClick={() => setApproval(a => ({ ...a, [letter]: "approved" }))} style={{ padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid #a7dfc8", background: "#e8f7f1", color: "#1a9e6e" }}>✓ Approve</button>
                          <button onClick={() => { setEdits(ed => ({ ...ed, [letter]: sec.content })); setApproval(a => ({ ...a, [letter]: sec.needsApproval ? "pending" : "approved" })); }} style={{ padding: "4px 10px", borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid #e0e4ea", background: "#fff", color: "#5a6478" }}>Reset</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#fff", border: "1px solid #e0e4ea", borderRadius: 8, marginTop: 5 }}>
                  <p style={{ fontSize: 13, color: "#5a6478" }}><strong style={{ color: "#0d1117" }}>{pendingCount} pending</strong></p>
                  <button onClick={() => setApproval(a => Object.fromEntries(Object.keys(a).map(k => [k, "approved"])))} style={{ padding: "5px 11px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", background: BLUE, color: "#fff" }}>Approve all</button>
                </div>
              </div>
            )}

            {/* Preview */}
            {tab === "preview" && (
              <iframe style={{ flex: 1, border: "none", background: "#fff" }} srcDoc={genHTML || "<p style='padding:20px;color:#999'>No preview yet.</p>"}/>
            )}
          </>
        )}
      </main>
    </div>
  );
}
