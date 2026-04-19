// Vercel Serverless Function — Whoop OAuth Callback
// Exchanges the ?code= param for access/refresh tokens, then redirects to the
// frontend with tokens in the URL so the browser can persist them in localStorage.

const CLIENT_ID = "d7ec07df-941f-4bf7-84cb-e9e8cfe90206";
const CLIENT_SECRET = "73ca9e4b96576df54075ba9b74ae0ce5a612e1e3aeaf01114771615c48bf876f";
const REDIRECT_URI = "https://projecttracker-mauve.vercel.app/api/whoop-callback";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const FRONTEND_URL = "https://projecttracker-mauve.vercel.app/";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(302, `${FRONTEND_URL}?whoop_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Whoop token exchange failed:", tokenRes.status, errBody);
      return res.redirect(
        302,
        `${FRONTEND_URL}?whoop_error=${encodeURIComponent("Token exchange failed: " + tokenRes.status)}`
      );
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate absolute expiry timestamp (ms since epoch)
    const expires_at = Date.now() + expires_in * 1000;

    const redirectParams = new URLSearchParams({
      whoop_token: access_token,
      whoop_refresh: refresh_token,
      whoop_expires: String(expires_at),
    });

    return res.redirect(302, `${FRONTEND_URL}?${redirectParams.toString()}`);
  } catch (e) {
    console.error("whoop-callback error:", e);
    return res.redirect(
      302,
      `${FRONTEND_URL}?whoop_error=${encodeURIComponent("Server error: " + e.message)}`
    );
  }
}
