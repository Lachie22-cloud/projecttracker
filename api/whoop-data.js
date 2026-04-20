// Vercel Serverless Function — Whoop Data Fetcher
// GET /api/whoop-data?token=ACCESS_TOKEN&refresh=REFRESH_TOKEN
//
// Fetches the latest recovery, sleep, and cycle records from the Whoop API.
// If the access token is expired (401), attempts a refresh and returns the
// new tokens alongside the data so the frontend can update localStorage.

const CLIENT_ID = "d7ec07df-941f-4bf7-84cb-e9e8cfe90206";
const CLIENT_SECRET = "73ca9e4b96576df54075ba9b74ae0ce5a612e1e3aeaf01114771615c48bf876f";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API = "https://api.prod.whoop.com/developer/v1";

// ---------------------------------------------------------------------------
// Helper: refresh the access token using the refresh token
// ---------------------------------------------------------------------------
async function refreshAccessToken(refreshToken) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken, // Whoop may or may not rotate
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// ---------------------------------------------------------------------------
// Helper: fetch a Whoop endpoint, returning { ok, status, data }
// ---------------------------------------------------------------------------
async function whoopGet(path, accessToken) {
  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = res.ok ? await res.json() : null;
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Helper: extract the most relevant record from a paginated Whoop response
// ---------------------------------------------------------------------------
function latest(response) {
  if (!response || !response.records || response.records.length === 0) return null;
  return response.records[0]; // Whoop returns newest-first by default
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let { token: accessToken, refresh: refreshToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Missing required query param: token" });
  }

  // Track whether we refreshed so the frontend knows to update localStorage
  let newTokens = null;

  // ---------------------------------------------------------------------------
  // Fetch all three endpoints; if any return 401 attempt a single token refresh
  // ---------------------------------------------------------------------------
  async function fetchAll(token) {
    const [recoveryRes, sleepRes, cycleRes] = await Promise.all([
      whoopGet("/recovery?limit=1", token),
      whoopGet("/sleep?limit=1", token),
      whoopGet("/cycle?limit=1", token),
    ]);
    return { recoveryRes, sleepRes, cycleRes };
  }

  let { recoveryRes, sleepRes, cycleRes } = await fetchAll(accessToken);

  // If any call is unauthorized, try refreshing once
  const needsRefresh =
    recoveryRes.status === 401 || sleepRes.status === 401 || cycleRes.status === 401;

  if (needsRefresh) {
    if (!refreshToken) {
      return res.status(401).json({
        error: "Access token expired and no refresh token provided. Re-authenticate via /api/whoop-auth.",
      });
    }

    try {
      newTokens = await refreshAccessToken(refreshToken);
      accessToken = newTokens.access_token;
      // Retry all three calls with the fresh token
      ({ recoveryRes, sleepRes, cycleRes } = await fetchAll(accessToken));
    } catch (e) {
      return res.status(401).json({ error: "Token refresh failed: " + e.message });
    }
  }

  // ---------------------------------------------------------------------------
  // Parse each record into a clean shape
  // ---------------------------------------------------------------------------
  const recoveryRecord = latest(recoveryRes.data);
  const sleepRecord = latest(sleepRes.data);
  const cycleRecord = latest(cycleRes.data);

  const recovery = recoveryRecord
    ? {
        score: recoveryRecord.score?.recovery_score ?? null,
        hrv_rmssd_milli: recoveryRecord.score?.hrv_rmssd_milli ?? null,
        resting_heart_rate: recoveryRecord.score?.resting_heart_rate ?? null,
        spo2_percentage: recoveryRecord.score?.spo2_percentage ?? null,
        skin_temp_celsius: recoveryRecord.score?.skin_temp_celsius ?? null,
        user_calibrating: recoveryRecord.score?.user_calibrating ?? null,
        cycle_id: recoveryRecord.cycle_id ?? null,
        created_at: recoveryRecord.created_at ?? null,
        updated_at: recoveryRecord.updated_at ?? null,
        score_state: recoveryRecord.score_state ?? null,
      }
    : null;

  const sleep = sleepRecord
    ? {
        score: sleepRecord.score?.stage_summary?.sleep_efficiency_percentage ?? null,
        sleep_performance_percentage: sleepRecord.score?.sleep_performance_percentage ?? null,
        sleep_consistency_percentage: sleepRecord.score?.sleep_consistency_percentage ?? null,
        total_in_bed_time_milli: sleepRecord.score?.stage_summary?.total_in_bed_time_milli ?? null,
        total_awake_time_milli: sleepRecord.score?.stage_summary?.total_awake_time_milli ?? null,
        total_no_data_time_milli: sleepRecord.score?.stage_summary?.total_no_data_time_milli ?? null,
        total_light_sleep_time_milli: sleepRecord.score?.stage_summary?.total_light_sleep_time_milli ?? null,
        total_slow_wave_sleep_time_milli: sleepRecord.score?.stage_summary?.total_slow_wave_sleep_time_milli ?? null,
        total_rem_sleep_time_milli: sleepRecord.score?.stage_summary?.total_rem_sleep_time_milli ?? null,
        sleep_cycle_count: sleepRecord.score?.stage_summary?.sleep_cycle_count ?? null,
        disturbance_count: sleepRecord.score?.stage_summary?.disturbance_count ?? null,
        respiratory_rate: sleepRecord.score?.respiratory_rate ?? null,
        start: sleepRecord.start ?? null,
        end: sleepRecord.end ?? null,
        created_at: sleepRecord.created_at ?? null,
        score_state: sleepRecord.score_state ?? null,
      }
    : null;

  const cycle = cycleRecord
    ? {
        strain: cycleRecord.score?.strain ?? null,
        kilojoule: cycleRecord.score?.kilojoule ?? null,
        average_heart_rate: cycleRecord.score?.average_heart_rate ?? null,
        max_heart_rate: cycleRecord.score?.max_heart_rate ?? null,
        start: cycleRecord.start ?? null,
        end: cycleRecord.end ?? null,
        created_at: cycleRecord.created_at ?? null,
      }
    : null;

  const responseBody = {
    recovery,
    sleep,
    cycle,
    fetchedAt: new Date().toISOString(),
  };

  // If we refreshed, surface the new tokens so the frontend can update its store
  if (newTokens) {
    responseBody.newTokens = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: newTokens.expires_at,
    };
  }

  return res.status(200).json(responseBody);
}
