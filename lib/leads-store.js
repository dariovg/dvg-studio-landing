/** Persistencia de leads (Postgres / Neon / Vercel Postgres). */
import { neon } from "@neondatabase/serverless";

function databaseUrl() {
  return process.env.LEADS_DATABASE_URL || process.env.DATABASE_URL || "";
}

export function leadsDatabaseConfigured() {
  return !!databaseUrl();
}

export async function ensureLeadsTable() {
  const url = databaseUrl();
  if (!url) return false;
  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS dvg_leads (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      interest TEXT,
      message TEXT,
      source TEXT NOT NULL DEFAULT 'web_chat',
      emailed BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;
  return true;
}

export async function saveLead(lead, { emailed = false, source = "web_chat" } = {}) {
  const url = databaseUrl();
  if (!url) return { ok: false, reason: "no_database" };

  try {
    const sql = neon(url);
    const rows = await sql`
      INSERT INTO dvg_leads (name, email, company, phone, interest, message, source, emailed)
      VALUES (
        ${lead.name},
        ${lead.email},
        ${lead.company || null},
        ${lead.phone || null},
        ${lead.interest || "pricing"},
        ${lead.message || null},
        ${source},
        ${!!emailed}
      )
      RETURNING id, created_at
    `;
    return { ok: true, id: rows[0]?.id, createdAt: rows[0]?.created_at };
  } catch (err) {
    if (/relation .* does not exist/i.test(err.message)) {
      try {
        await ensureLeadsTable();
        return saveLead(lead, { emailed, source });
      } catch (retryErr) {
        console.error("Leads DB (create table):", retryErr.message);
        return { ok: false, reason: retryErr.message };
      }
    }
    console.error("Leads DB:", err.message);
    return { ok: false, reason: err.message };
  }
}
