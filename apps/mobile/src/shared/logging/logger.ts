const sensitiveKeyPattern =
  /token|secret|password|authorization|cookie|session|refresh|access|apikey|api_key|service_role/i;
const sensitiveStringPattern =
  /bearer\s+[a-z0-9._-]+|eyj[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+|service[_-]?role|refresh[_-]?token|access[_-]?token/i;

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogMetadata =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogMetadata[]
  | { [key: string]: LogMetadata };

export type Logger = {
  debug: (message: string, metadata?: LogMetadata) => void;
  info: (message: string, metadata?: LogMetadata) => void;
  warn: (message: string, metadata?: LogMetadata) => void;
  error: (message: string, metadata?: LogMetadata) => void;
};

function sanitizeMetadataValue(value: LogMetadata, depth = 0): LogMetadata {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return sensitiveStringPattern.test(value) ? "[redacted]" : value;
  }
  if (typeof value !== "object") return value;
  if (depth >= 4) return "[redacted-depth]";

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[redacted]" : sanitizeMetadataValue(nestedValue, depth + 1),
    ]),
  );
}

export function sanitizeLogMetadata(metadata?: LogMetadata): LogMetadata {
  return sanitizeMetadataValue(metadata);
}

function writeLog(level: LogLevel, message: string, metadata?: LogMetadata): void {
  const sanitizedMetadata = sanitizeLogMetadata(metadata);
  const payload = sanitizedMetadata === undefined ? [message] : [message, sanitizedMetadata];

  if (level === "debug") {
    console.debug(...payload);
    return;
  }

  if (level === "info") {
    console.info(...payload);
    return;
  }

  if (level === "warn") {
    console.warn(...payload);
    return;
  }

  console.error(...payload);
}

export const logger: Logger = {
  debug: (message, metadata) => writeLog("debug", message, metadata),
  error: (message, metadata) => writeLog("error", message, metadata),
  info: (message, metadata) => writeLog("info", message, metadata),
  warn: (message, metadata) => writeLog("warn", message, metadata),
};

export function logBusinessEvent(message: string, metadata?: LogMetadata): void {
  logger.info(message, metadata);
}
