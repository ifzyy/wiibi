import winston from 'winston';

const { combine, timestamp, errors, colorize, printf } = winston.format;
const isProd = process.env.NODE_ENV === 'production';

// ── Dev format: clean readable lines ─────────────────────────────────────────
//
//  2026-03-04 11:02:33 [ERROR] POST /api/cart/items 422
//  Message : "productId" must be a valid GUID
//  Code    : VALIDATION_ERROR
//  IP      : ::1
//
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const time   = ts ? String(ts).slice(0, 19).replace('T', ' ') : '';
  const method = meta.method || '';
  const path   = meta.path   || '';
  const status = meta.statusCode ? ` ${meta.statusCode}` : '';
  const route  = method && path ? ` ${method} ${path}${status}` : '';

  let out = `${time} [${level.toUpperCase()}]${route}\n`;
  out    += `  Message : ${message}\n`;

  if (meta.code)    out += `  Code    : ${meta.code}\n`;
  if (meta.ip)      out += `  IP      : ${meta.ip}\n`;
  if (meta.service) out += `  Service : ${meta.service}\n`;

  // Only print stack in dev, and only the first 4 lines to keep it readable
  if (stack && !isProd) {
    const lines = String(stack).split('\n').slice(0, 5).join('\n    ');
    out += `  Stack   :\n    ${lines}\n`;
  }

  return out.trimEnd();
});

// ── Prod format: JSON (structured for log aggregators like Datadog / Logtail) -
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd
    ? prodFormat
    : combine(timestamp(), errors({ stack: true }), colorize({ level: true }), devFormat),
  defaultMeta: { service: process.env.APP_NAME || 'App' },
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;