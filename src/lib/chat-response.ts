interface ChatResponseRecord {
  [key: string]: unknown;
}

export interface ChatResponseTicket {
  ticketRef: string;
  category: string;
  priority: string;
  status: string;
  emailSent: boolean;
}

export interface NormalizedChatResponse {
  reply: string;
  conversationStatus?: string;
  timestamp: string;
  ticket?: ChatResponseTicket;
}

const RESPONSE_KEYS = ["data", "response", "result", "body"] as const;

const isRecord = (value: unknown): value is ChatResponseRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stripCodeFences = (value: string) =>
  value.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

const tryParseJson = (value: string): unknown | null => {
  const cleaned = stripCodeFences(value);

  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonStart = cleaned.search(/[\[{]/);

    if (jsonStart === -1) return null;

    const opening = cleaned[jsonStart];
    const closing = opening === "[" ? "]" : "}";
    const jsonEnd = cleaned.lastIndexOf(closing);

    if (jsonEnd === -1 || jsonEnd <= jsonStart) return null;

    const candidate = cleaned.slice(jsonStart, jsonEnd + 1);

    try {
      return JSON.parse(candidate);
    } catch {
      const repaired = candidate
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

      try {
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  }
};

const hasChatFields = (record: ChatResponseRecord) =>
  ["reply", "message", "ticket", "conversationStatus", "timestamp"].some(
    (key) => key in record,
  );

const resolveResponseRecord = (value: unknown): ChatResponseRecord | null => {
  if (typeof value === "string") {
    const parsed = tryParseJson(value);
    return parsed ? resolveResponseRecord(parsed) : null;
  }

  if (!isRecord(value)) return null;

  if (hasChatFields(value)) {
    if (isRecord(value.reply)) {
      return resolveResponseRecord(value.reply) ?? value;
    }

    return value;
  }

  for (const key of RESPONSE_KEYS) {
    const nested = resolveResponseRecord(value[key]);
    if (nested) return nested;
  }

  return value;
};

const extractTextFromString = (value: string, depth = 0): string => {
  const cleaned = stripCodeFences(value);

  if (depth < 3) {
    const parsed = tryParseJson(cleaned);

    if (parsed) {
      const parsedText = extractDisplayText(parsed, depth + 1);
      if (parsedText) return parsedText;
    }
  }

  const embeddedJsonStart = cleaned.search(/\n\s*[\[{]/);
  if (embeddedJsonStart > 0) {
    const prefix = cleaned.slice(0, embeddedJsonStart).trim();
    if (prefix) return prefix;
  }

  return cleaned;
};

const extractTextFromRecord = (record: ChatResponseRecord, depth = 0): string => {
  if (typeof record.reply === "string") {
    const replyText = extractTextFromString(record.reply, depth + 1);
    if (replyText) return replyText;
  }

  if (isRecord(record.reply)) {
    const nestedReply = extractTextFromRecord(record.reply, depth + 1);
    if (nestedReply) return nestedReply;
  }

  if (typeof record.message === "string") {
    const messageText = extractTextFromString(record.message, depth + 1);
    if (messageText) return messageText;
  }

  for (const key of RESPONSE_KEYS) {
    const nested = record[key];

    if (typeof nested === "string") {
      const nestedText = extractTextFromString(nested, depth + 1);
      if (nestedText) return nestedText;
    }

    if (isRecord(nested)) {
      const nestedText = extractTextFromRecord(nested, depth + 1);
      if (nestedText) return nestedText;
    }
  }

  return "";
};

const extractDisplayText = (value: unknown, depth = 0): string => {
  if (typeof value === "string") return extractTextFromString(value, depth);
  if (isRecord(value)) return extractTextFromRecord(value, depth);
  return "";
};

const readString = (record: ChatResponseRecord | null, key: string) =>
  record && typeof record[key] === "string" ? String(record[key]) : undefined;

const readTicket = (record: ChatResponseRecord | null): ChatResponseTicket | undefined => {
  if (!record || !isRecord(record.ticket)) return undefined;

  const ticket = record.ticket;

  if (
    typeof ticket.ticketRef === "string" &&
    typeof ticket.category === "string" &&
    typeof ticket.priority === "string" &&
    typeof ticket.status === "string" &&
    typeof ticket.emailSent === "boolean"
  ) {
    return {
      ticketRef: ticket.ticketRef,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      emailSent: ticket.emailSent,
    };
  }

  return undefined;
};

export const normalizeChatResponse = (raw: unknown): NormalizedChatResponse => {
  const rootRecord = isRecord(raw) ? raw : null;
  const responseRecord = resolveResponseRecord(raw);
  const reply =
    extractDisplayText(responseRecord) ||
    extractDisplayText(rootRecord) ||
    (typeof raw === "string" ? extractTextFromString(raw) : "") ||
    "I apologize, but I couldn't read the response properly.";

  return {
    reply,
    conversationStatus:
      readString(responseRecord, "conversationStatus") ??
      readString(rootRecord, "conversationStatus"),
    timestamp:
      readString(responseRecord, "timestamp") ??
      readString(rootRecord, "timestamp") ??
      new Date().toISOString(),
    ticket: readTicket(responseRecord) ?? readTicket(rootRecord),
  };
};