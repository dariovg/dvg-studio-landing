/**
 * Envía eventos de la landing al CRM (Vercel).
 * Requiere CRM_API_URL y CRM_INGEST_SECRET en Vercel (landing).
 */

export function crmConfigured() {
  return !!(process.env.CRM_API_URL && process.env.CRM_INGEST_SECRET);
}

async function postToCrm(path, payload) {
  const base = (process.env.CRM_API_URL || "").replace(/\/$/, "");
  const secret = process.env.CRM_INGEST_SECRET || "";
  if (!base || !secret) {
    console.warn(`CRM ingest/${path} skipped: configure CRM_API_URL and CRM_INGEST_SECRET on Vercel (landing)`);
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(`${base}/api/ingest/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CRM-Ingest-Secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`CRM ingest/${path}:`, data.error || res.status);
      return { ok: false, error: data.error };
    }
    return { ok: true, ...data };
  } catch (err) {
    console.error(`CRM ingest/${path}:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function syncToCrm(path, payload) {
  const result = await postToCrm(path, payload);
  if (!result.ok) {
    console.error(`CRM ingest/${path} failed:`, result.error || result.skipped || "unknown");
  }
  return result;
}

export function syncLeadToCrm(lead, { emailed = false } = {}) {
  return syncToCrm("lead", { ...lead, emailed });
}

export function syncBookingToCrm(booking) {
  return syncToCrm("booking", booking);
}

export function syncSurveyToCrm(survey) {
  return syncToCrm("survey", survey);
}
