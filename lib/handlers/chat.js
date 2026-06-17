import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { matchFaq, fallbackReply } from "../chat-faq.js";
import { wantsPricingIntent, wantsMeetingIntent } from "../chat-intent.js";
import {
  matchLocalKnowledge,
  relevantKnowledgeSnippet,
  bedrockMode,
} from "../chat-local-knowledge.js";
import { checkRateLimit, canCallBedrock, recordBedrockCall } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
  validateMessage,
  isRepeatedMessage,
} from "../chat-security.js";
import { CONTACT_EMAIL } from "../site-config.js";

function buildSystem(snippet) {
  const mail = CONTACT_EMAIL;
  return `Eres IGNITE, asistente web de DVG Studio. Español, máximo 80 palabras, tono humano y cercano.

REGLAS:
1. Responde SOLO con el FRAGMENTO.
2. Si falta info: ofrece reunión gratis o ${mail}.
3. No inventes datos. No hables de AWS, Bedrock, RGPD ni garantías legales.
4. Para agendar: invita a decir «podemos quedar» o «agendar cita».

--- FRAGMENTO ---
${snippet}
--- FIN ---`;
}

function pricingReply() {
  return "Nuestro producto son agentes de IA desde 349 €/mes + IVA (mín. 3 meses). La auditoría es gratis; la implementación se cotiza aparte. Si quieres, te envío la guía completa por email — son 30 segundos.";
}

function meetingReply() {
  return "Perfecto — di «agendar cita» o «podemos quedar mañana a las 10» y te guío paso a paso. Reunión de 1h gratis, sin compromiso.";
}

async function callBedrock(trimmed) {
  const region = process.env.AWS_REGION || "us-east-1";
  const modelId =
    process.env.BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0";

  const snippet = relevantKnowledgeSnippet(trimmed);
  const client = new BedrockRuntimeClient({ region });
  const out = await client.send(
    new ConverseCommand({
      modelId,
      system: [{ text: buildSystem(snippet) }],
      messages: [{ role: "user", content: [{ text: trimmed }] }],
      inferenceConfig: { maxTokens: 120, temperature: 0.05 },
    })
  );

  return out.output?.message?.content?.map((c) => c.text).join("").trim() || "";
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

  const { message } = body;
  if (!message || typeof message !== "string" || message.length > 250) {
    return res.status(400).json({ error: "Mensaje inválido" });
  }

  const trimmed = message.trim();
  const mode = bedrockMode();

  if (wantsPricingIntent(trimmed)) {
    return res.status(200).json({
      reply: pricingReply(),
      suggestLead: "pricing",
      source: "pricing",
    });
  }

  if (wantsMeetingIntent(trimmed)) {
    return res.status(200).json({
      reply: meetingReply(),
      source: "meeting",
    });
  }

  const faqReply = matchFaq(trimmed);
  if (faqReply) {
    return res.status(200).json({
      reply: faqReply,
      source: "faq",
      suggestLead: wantsPricingIntent(trimmed) ? "pricing" : null,
    });
  }

  const localReply = matchLocalKnowledge(trimmed);
  if (localReply) {
    return res.status(200).json({ reply: localReply, source: "local" });
  }

  if (!validateMessage(trimmed) || isRepeatedMessage(ip, trimmed)) {
    return res.status(200).json({
      reply: fallbackReply(trimmed),
      source: "fallback",
    });
  }

  if (mode === "off" || !process.env.AWS_ACCESS_KEY_ID) {
    return res.status(200).json({
      reply: fallbackReply(trimmed),
      source: "fallback",
    });
  }

  const maxBedrock = Number(process.env.CHAT_BEDROCK_DAILY_MAX) || 40;
  if (!canCallBedrock(maxBedrock)) {
    return res.status(200).json({
      reply: `Hoy he respondido muchas consultas. Escríbenos a ${CONTACT_EMAIL} o pregúntame por precios, planes o «podemos quedar».`,
      source: "fallback",
    });
  }

  try {
    recordBedrockCall();
    let reply = await callBedrock(trimmed);
    if (!reply || reply.length < 8) {
      reply = fallbackReply(trimmed);
    }
    return res.status(200).json({ reply, source: "bedrock" });
  } catch (err) {
    console.error("Bedrock:", err.message);
    return res.status(200).json({
      reply: fallbackReply(trimmed),
      source: "fallback",
    });
  }
}
