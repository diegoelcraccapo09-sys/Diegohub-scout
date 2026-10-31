// Diego Hub — narrow Roblox public-server proxy
// Deploy as a Cloudflare Worker. This is NOT an open proxy.
const GAME_ID = "107778070777162";
const ALLOWED_ORIGIN = "https://diegoelcraccapo09-sys.github.io";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Origin not allowed", { status: 403 });
    }

    const headers = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "GET" || url.pathname !== "/servers") {
      return new Response("Not found", { status: 404, headers });
    }

    const upstream = new URL(
      `https://games.roblox.com/v1/games/${GAME_ID}/servers/Public`
    );
    upstream.searchParams.set("limit", "100");
    upstream.searchParams.set("sortOrder", "Asc");
    const cursor = url.searchParams.get("cursor");
    if (cursor) upstream.searchParams.set("cursor", cursor);

    try {
      const result = await fetch(upstream, {
        headers: { "Accept": "application/json" }
      });
      const body = await result.text();
      const responseHeaders = new Headers(headers);
      responseHeaders.set("Content-Type", "application/json; charset=utf-8");
      responseHeaders.set("Cache-Control", "no-store");
      const retryAfter = result.headers.get("Retry-After");
      if (retryAfter) responseHeaders.set("Retry-After", retryAfter);
      return new Response(body, {
        status: result.status,
        headers: responseHeaders
      });
    } catch {
      return new Response(JSON.stringify({ error: "Roblox upstream unavailable" }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
      });
    }
  }
};
