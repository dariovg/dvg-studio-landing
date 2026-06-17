import chat from "../lib/handlers/chat.js";
import book from "../lib/handlers/book.js";
import availability from "../lib/handlers/availability.js";
import lead from "../lib/handlers/lead.js";
import status from "../lib/handlers/status.js";

const routes = { chat, book, availability, lead, status };

export default async function handler(req, res) {
  const route = String(req.query?.route || "").toLowerCase();
  const fn = routes[route];
  if (!fn) {
    return res.status(404).json({ error: "Not found" });
  }
  return fn(req, res);
}
