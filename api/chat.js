import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const SYSTEM = `Eres IGNITE, asistente comercial de DVG Studio (España).
Respondes en español, tono cercano y profesional, como un empleado digital que inspira confianza.

DVG Studio crea empleados digitales (agentes IA autónomos) para PYMEs:
- Trabajan 24/7 en WhatsApp, Telegram, email, web
- Automatizan atención al cliente, leads, cotizaciones y agendas
- Planes: Starter €199/mes (1 agente), Pro €499/mes (5 agentes), Enterprise €2.499/mes (20 agentes)
- Auditoría gratuita sin compromiso
- Mínimo recomendado 3 meses para calibrar el agente al negocio

Sé conciso (máx. 120 palabras). Si no sabes algo, invita a solicitar auditoría gratis o contact@dvgstudio.com.
No inventes datos técnicos ni casos de clientes específicos.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const region = process.env.AWS_REGION || "us-east-1";
  const modelId =
    process.env.BEDROCK_MODEL_ID ||
    "us.anthropic.claude-haiku-4-5-20251001-v1:0";

  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
    return res.status(503).json({
      error: "Chat no configurado",
      reply:
        "El asistente IA se está activando. Mientras tanto, escríbenos por WhatsApp o solicita auditoría gratis.",
    });
  }

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "Mensaje inválido" });
  }

  const messages = [
    ...history.slice(-8).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: [{ text: String(m.content).slice(0, 2000) }],
    })),
    { role: "user", content: [{ text: message.slice(0, 2000) }] },
  ];

  try {
    const client = new BedrockRuntimeClient({ region });
    const cmd = new ConverseCommand({
      modelId,
      system: [{ text: SYSTEM }],
      messages,
      inferenceConfig: { maxTokens: 512, temperature: 0.4 },
    });
    const out = await client.send(cmd);
    const reply =
      out.output?.message?.content?.map((c) => c.text).join("") ||
      "No pude generar respuesta. Intenta de nuevo.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Bedrock error:", err);
    return res.status(500).json({
      error: "Error del asistente",
      reply: "Hubo un problema técnico. Prueba en unos segundos o contáctanos directamente.",
    });
  }
}
