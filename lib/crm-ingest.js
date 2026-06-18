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
  if (!base || !secret) return { ok: false, skipped: true };

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

export function syncLeadToCrm(lead, { emailed = false } = {}) {
  return postToCrm("lead", { ...lead, emailed });
}

export function syncBookingToCrm(booking) {
  return postToCrm("booking", booking);
}

export function syncSurveyToCrm(survey) {
  return postToCrm("survey", survey);
}
