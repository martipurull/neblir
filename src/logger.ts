import pino from 'pino';

/**
 * Determines if the current environment is development.
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Centralised logger instance configured with pino.
 *
 * - Uses log level from environment variable LOG_LEVEL or defaults to 'debug' for development and 'info' otherwise.
 * - Applies 'pino-pretty' transport with colourised output and timestamp when in development mode.
 * - Strips process ID from log base properties for cleaner output.
 *
 * This logger should be imported and used across the application for consistent structured logging.
 */
const logger = pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    transport: isDevelopment ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'yyyy-mm-dd HH:MM:ss' },
    } : undefined,
    base: {
        pid: false,
    },
});

export default logger;
