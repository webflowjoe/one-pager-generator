
export async function POST(request) {
  try {
    const { html } = await request.json();
    if (!html) return new Response("html is required", { status: 400 });
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": "attachment; filename=webflow-one-pager.html",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
