import fs from "fs";
import path from "path";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { matchFaq } from "../lib/chat-faq.js";
import { checkRateLimit, canCallBedrock, recordBedrockCall } from "../lib/rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
  validateMessage,
  isRepeatedMessage,
  sanitizeHistory,
} from "../lib/chat-security.js";
import { CONTACT_EMAIL } from "../lib/site-config.js";

let knowledgeCache = "";

function loadKnowledge() {
  if (knowledgeCache) return knowledgeCache;
  const file = path.join(process.cwd(), "knowledge", "empresa.md");
  knowledgeCache = fs.readFileSync(file, "utf8");
  return knowledgeCache;
}

function buildSystem(knowledge) {
  const mail = CONTACT_EMAIL;
  return `Asistente web de DVG Studio. Español, máximo 80 palabras, tono profesional y cercano.

REGLAS:
1. Responde SOLO con el DOCUMENTO.
2. Si no está: deriva a ${mail} o «agendar cita» en el chat.
3. NUNCA hables de RGPD, garantías legales, responsabilidad, ROI garantizado ni cumplimiento normativo.
4. Para temas legales/privacidad: solo di que contacten a ${mail}.
5. No inventes datos ni casos de clientes. No menciones OpenClaw ni AWS.

--- DOCUMENTO ---
${knowledge}
--- FIN ---`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-DVG-Chat");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!validateOrigin(req)) {
    return res.status(403).json({ reply: "Acceso no permitido." });
  }

  if (!validateUserAgent(req)) {
    return res.status(403).json({ reply: "Acceso no permitido." });
  }

  const ip = clientIp(req);
  const limit = checkRateLimit(ip, {
    perHour: Number(process.env.CHAT_LIMIT_HOUR) || 6,
    perDay: Number(process.env.CHAT_LIMIT_DAY) || 20,
  });

  if (!limit.ok) {
    return res.status(429).json({
      reply: `Has hecho muchas preguntas. Escríbenos a ${CONTACT_EMAIL}.`,
    });
  }

  const body = req.body || {};

  if (!validateSiteKey(body) || !validateHoneypot(body) || !validateTiming(body)) {
    return res.status(403).json({ reply: "Solicitud no válida." });
  }

  const { message, history = [] } = body;
  if (!message || typeof message !== "string" || message.length > 250) {
    return res.status(400).json({ error: "Mensaje inválido" });
  }

  const trimmed = message.trim();

  if (!validateMessage(trimmed) || isRepeatedMessage(ip, trimmed)) {
    return res.status(400).json({
      reply: `No pude procesar ese mensaje. Reformúlalo o escribe a ${CONTACT_EMAIL}`,
    });
  }

  const faqReply = matchFaq(trimmed);
  if (faqReply) {
    return res.status(200).json({ reply: faqReply, source: "faq" });
  }

  if (!process.env.AWS_ACCESS_KEY_ID) {
    return res.status(200).json({
      reply:
        `No tengo esa respuesta aquí. Escríbenos a ${CONTACT_EMAIL} o pregunta por precios, planes o auditoría gratis.`,
    });
  }

  const maxBedrock = Number(process.env.CHAT_BEDROCK_DAILY_MAX) || 100;
  if (!canCallBedrock(maxBedrock)) {
    return res.status(200).json({
      reply: `Hoy el asistente automático está al límite. Escríbenos a ${CONTACT_EMAIL}.`,
    });
  }

  const region = process.env.AWS_REGION || "us-east-1";
  const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
  const safeHistory = sanitizeHistory(history);

  const messages = [
    ...safeHistory.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: [{ text: m.content }],
    })),
    { role: "user", content: [{ text: trimmed }] },
  ];

  try {
    recordBedrockCall();
    const knowledge = loadKnowledge();
    const client = new BedrockRuntimeClient({ region });
    const out = await client.send(
      new ConverseCommand({
        modelId,
        system: [{ text: buildSystem(knowledge) }],
        messages,
        inferenceConfig: { maxTokens: 100, temperature: 0.1 },
      })
    );
    const reply =
      out.output?.message?.content?.map((c) => c.text).join("") ||
      `No pude responder. ${CONTACT_EMAIL}`;
    return res.status(200).json({ reply, source: "bedrock" });
  } catch (err) {
    console.error("Bedrock:", err.message);
    return res.status(200).json({
      reply: `Error temporal. ${CONTACT_EMAIL} o pregunta por precios/planes.`,
    });
  }
}
