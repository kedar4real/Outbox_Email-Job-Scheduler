import { Request } from "express";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";

import { logger } from "../utils/logger";

const SENSITIVE_KEYS = new Set(["password", "token", "authorization", "cookie"]);

const sanitize = (value: unknown): unknown => {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[redacted]";
    } else {
      sanitized[key] = sanitize(val);
    }
  }

  return sanitized;
};

/**
 * Request/response logging middleware with correlation IDs.
 */
const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-correlation-id"];
    const correlationId = Array.isArray(existing) ? existing[0] : existing;
    const id = correlationId || randomUUID();
    res.setHeader("x-correlation-id", id);
    return id;
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: sanitize(req.headers),
      body: sanitize(req.body),
      user: sanitize((req as Request & { user?: unknown }).user)
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  }
});

export { requestLogger };
