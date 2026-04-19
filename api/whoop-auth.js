// Vercel Serverless Function — Whoop OAuth Initiation
// Redirects the user to Whoop's OAuth authorization page.

const CLIENT_ID = "d7ec07df-941f-4bf7-84cb-e9e8cfe90206";
const REDIRECT_URI = "https://projecttracker-mauve.vercel.app/api/whoop-callback";
const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const SCOPES = "offline read:profile read:recovery read:sleep read:workout read:cycles";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Generate a random state value and store it in a short-lived cookie
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  });

  res.setHeader("Set-Cookie", `whoop_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  const authorizeUrl = `${AUTH_URL}?${params.toString()}`;
  return res.redirect(302, authorizeUrl);
}
