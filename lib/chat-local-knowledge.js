import fs from "fs";
import path from "path";

const STOP = new Set([
  "para", "como", "cómo", "este", "esta", "estos", "son", "del", "los", "las", "una", "uno",
  "con", "por", "que", "qué", "sus", "todo", "todos", "desde", "sobre", "cuando", "donde",
]);

let cache = null;

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function keywordsFrom(text) {
  return [
    ...new Set(
      normalize(text)
        .replace(/[^a-z0-9áéíóúñü\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w))
    ),
  ];
}

function loadKnowledgeIndex() {
  if (cache) return cache;

  const raw = fs.readFileSync(path.join(process.cwd(), "knowledge", "empresa.md"), "utf8");
  const faqPairs = [];
  const faqMatch = raw.match(/## Preguntas frecuentes([\s\S]*?)(?=\n## |$)/);
  if (faqMatch) {
    for (const block of faqMatch[1].split(/\n\n+/)) {
      const p = block.match(/^P:\s*(.+)/m);
      const r = block.match(/^R:\s*(.+)/m);
      if (p && r) {
        faqPairs.push({
          question: p[1].trim(),
          answer: r[1].trim(),
          keywords: keywordsFrom(p[1]),
        });
      }
    }
  }

  const sections = [];
  for (const part of raw.split(/^## /m).slice(1)) {
    const nl = part.indexOf("\n");
    const title = part.slice(0, nl).trim();
    const body = part.slice(nl + 1).trim();
    if (!title || title === "Preguntas frecuentes" || title === "Este chat") continue;
    sections.push({
      title,
      body,
      keywords: keywordsFrom(`${title} ${body}`),
    });
  }

  cache = { faqPairs, sections };
  return cache;
}

function scoreKeywords(query, keywords) {
  const q = normalize(query);
  const qWords = q.split(/\s+/).filter((w) => w.length > 3);
  let score = 0;
  for (const kw of keywords) {
    if (q.includes(kw)) score += kw.length > 6 ? 2 : 1;
  }
  for (const w of qWords) {
    if (keywords.some((k) => k.includes(w) || w.includes(k))) score += 1;
  }
  return score;
}

function trimWords(text, maxWords = 85) {
  const clean = String(text || "")
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(/\s+/);
  if (words.length <= maxWords) return clean;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function summarizeSection(body) {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("|") && !/^#/.test(l));
  return trimWords(lines.slice(0, 5).join(" "));
}

/** Respuesta sin LLM a partir del markdown de conocimiento */
export function matchLocalKnowledge(message) {
  const { faqPairs, sections } = loadKnowledgeIndex();
  const q = normalize(message);

  let bestFaq = null;
  let bestFaqScore = 0;
  for (const item of faqPairs) {
    const score = scoreKeywords(q, item.keywords);
    if (score > bestFaqScore) {
      bestFaqScore = score;
      bestFaq = item.answer;
    }
  }
  if (bestFaqScore >= 2 && bestFaq) return bestFaq;

  let bestSec = null;
  let bestSecScore = 0;
  for (const sec of sections) {
    const score = scoreKeywords(q, sec.keywords);
    if (score > bestSecScore) {
      bestSecScore = score;
      bestSec = sec;
    }
  }
  if (bestSecScore >= 3 && bestSec) return summarizeSection(bestSec.body);

  return null;
}

/** Fragmento relevante para Bedrock (no mandar los 10 KB enteros) */
export function relevantKnowledgeSnippet(message, maxChars = 2200) {
  const { sections } = loadKnowledgeIndex();
  const scored = sections
    .map((sec) => ({ sec, score: scoreKeywords(message, sec.keywords) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 2);
  const picked = top.length ? top.map((s) => s.sec) : [sections.find((s) => s.title.includes("Quiénes"))].filter(Boolean);

  const text = picked
    .map((s) => `### ${s.title}\n${s.body}`)
    .join("\n\n")
    .slice(0, maxChars);

  return text || sections[0]?.body?.slice(0, maxChars) || "";
}

export function bedrockMode() {
  const mode = String(process.env.CHAT_BEDROCK_MODE || "fallback").toLowerCase();
  if (mode === "off" || mode === "0" || mode === "false") return "off";
  if (mode === "always") return "always";
  return "fallback";
}
