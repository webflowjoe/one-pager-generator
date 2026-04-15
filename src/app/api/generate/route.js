
function buildPrompt({ feature, featureName, activeSections, proof, intg, logos, pairNotes }) {
  const proofNote = activeSections.includes("F")
    ? proof?.stat
      ? `PROOF (pre-approved, use exactly): stat="${proof.stat}", label="${proof.label}", quote="${proof.quote}", attribution="${proof.attr}"`
      : `PROOF: none supplied — derive if possible, set needsApproval:true`
    : "";

  return `You are a Webflow PMM expert. Complete every step then reply with ONLY a JSON code block.

STEP 1 — Web search: fetch https://webflow.com/features/${feature} and extract headline, tagline, feature descriptions, benefits, differentiators, customer stats/quotes, integration mentions.

STEP 2 — Write copy for active sections: ${activeSections.join(", ")}.
${pairNotes?.length ? "Layout: " + pairNotes.join(" ") : ""}
${proofNote}
${activeSections.includes("G") ? `Integration panel: type=${intg?.type || "export"}, tools: ${intg?.tools || "derive from feature knowledge, needsApproval:true if uncertain"}` : ""}
${activeSections.includes("H") ? `Logo pond: ${logos || "The Telegraph, Verifone, Sourcegraph, Comscore, LiveRamp"}` : ""}
Set needsApproval:true for derived content. In content fields use plain text only, no asterisks, no markdown.

STEP 3 — Build a complete self-contained HTML one-pager matching Webflow brand:
- Page: white bg, max-width:820px, margin:0 auto, padding:48px 56px, font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif, 14px, color:#1a1a1a
- A: flex row gap:14px mb:32px — Webflow W SVG (<svg width="42" height="30" viewBox="0 0 80 56" fill="none"><path d="M49.5 0L34.5 39.2L27 17.5H13.5L27 56L34.5 56L49.5 16.8L64.5 56H78L49.5 0Z" fill="#1a6fc4"/><path d="M0 17.5L13.5 56L20.5 37.1L13.5 17.5H0Z" fill="#1a6fc4"/></svg>) + div(h1 inline "Webflow" color:#1a1a1a 36px 700 + span " ${featureName}" color:#1a6fc4 36px 700 + p tagline 16px color:#444 mt:4px)
- B+C: flex gap:36px mb:32px; B flex:1.2 — h2 20px 600 color:#1a1a1a mb:16px border-bottom:2px solid #e0e4ea pb:10px + 3 bullets each flex gap:14px mb:16px (36px circle bg:#e8f2fc border-radius:50% flex-center flex-shrink:0 with simple SVG icon in #1a6fc4) + div(p strong 14px 600 mb:2px + p 13px color:#5a6478); C flex:1 bg:#f0f4f8 border-radius:10px height:240px flex-center color:#9aa0ad 13px; ${!activeSections.includes("B") || !activeSections.includes("C") ? "one off — active: width:65% margin:0 auto" : ""}
- D+E: flex gap:24px mb:24px; ${!activeSections.includes("D") || !activeSections.includes("E") ? "one off — active: width:65% margin:0 auto;" : ""} D flex:1 bg:#f5f6f8 border-radius:12px padding:22px 26px — two groups each p 13px 700 mb:8px mt:16px first:mt:0 + ul list-style:none each li flex gap:8px mb:6px 13px color:#3a3a3a with bullet span 6px circle bg:#1a6fc4 border-radius:50% flex-shrink:0 mt:6px; E flex:1.1 — h3 "The ${featureName} difference" 18px 700 mb:8px + div 36px 3px bg:#1a6fc4 border-radius:2px mb:20px + 4 items flex gap:12px mb:16px — 22px circle bg:#e8f2fc border-radius:50% flex-center flex-shrink:0 (checkmark ✓ color:#1a6fc4 12px 700) + div(p 14px 700 mb:2px + p 13px color:#5a6478 with one key phrase in strong)
- F+G: flex gap:24px mb:24px; ${!activeSections.includes("F") || !activeSections.includes("G") ? "one off — active: width:65% margin:0 auto;" : ""} F flex:1 bg:#eef4fc border-radius:12px padding:22px 26px flex gap:16px align-items:flex-start — 64px circle bg:#d0e4f7 flex-shrink:0 + div(p 40px 800 color:#1a6fc4 lh:1 + p 14px color:#5a6478 mb:12px + p 13px color:#3a3a3a italic lh:1.6 mb:10px + p 11px 700 color:#7a8499 uppercase letter-spacing:0.05em); G flex:1 border:1px solid #e0e4ea border-radius:12px padding:22px 26px — h4 15px 700 mb:4px + p 11px color:#9aa0ad mb:14px + div flex flex-wrap gap:8px — each tool span border:1px solid #e0e4ea border-radius:6px padding:5px 12px 12px color:#3a3a3a bg:#fafafa
- H: bg:#1a6fc4 border-radius:12px padding:20px 36px mt:4px flex flex-direction:column align-items:center — p "Trusted by top brands" color:rgba(255,255,255,0.7) 11px 600 uppercase letter-spacing:0.08em mb:14px + div flex justify-content:center gap:36px flex-wrap — each logo span color:white 13px 600 opacity:0.9
- Omit inactive sections entirely.
- End with: <style>@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}body{margin:0;padding:0;}}</style>

CRITICAL: Reply with ONLY the JSON block below. html field: escape all double quotes as \\" and newlines as \\n, use single quotes for HTML attributes.

\`\`\`json
{"type":"ONE_PAGER_RESULT","feature":"${feature}","featureName":"${featureName}","sections":{"A":{"label":"Product title block","content":"...","needsApproval":false}},"html":"<!DOCTYPE html><html><body>...</body></html>"}
\`\`\`

Active sections: ${activeSections.join(",")}. html = single-line fully escaped HTML string.`;
}

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }
    const body = await request.json();
    const { feature, featureName, activeSections, proof, intg, logos, pairNotes } = body;
    if (!feature) return Response.json({ error: "feature is required" }, { status: 400 });

    const prompt = buildPrompt({ feature, featureName, activeSections, proof, intg, logos, pairNotes });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: "Anthropic API error", detail: err }, { status: 500 });
    }

    const data = await response.json();
    const fullText = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");

    const fenceMatch = fullText.match(/```json\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return Response.json(JSON.parse(fenceMatch[1].trim()));
      } catch (e) {}
    }

    const beforeHtml = fullText.match(/\{[\s\S]*?"sections"\s*:\s*(\{[\s\S]*?\})\s*,\s*"html"/);
    const htmlContent = fullText.match(/"html"\s*:\s*"([\s\S]*?)(?="\s*\}?\s*(?:```|$))/);
    if (beforeHtml && htmlContent) {
      try {
        const sections = JSON.parse(beforeHtml[1]);
        const html = htmlContent[1].replace(/\\n/g,"\n").replace(/\\t/g,"\t").replace(/\\"/g,'"').replace(/\\\\/g,"\\");
        return Response.json({ type: "ONE_PAGER_RESULT", feature, featureName, sections, html });
      } catch (e) {}
    }

    return Response.json({ error: "Could not parse response. Try again.", raw: fullText.slice(0, 600) }, { status: 500 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
