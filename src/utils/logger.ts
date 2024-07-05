import { createLogger, transports, format } from 'winston';

export const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
		format.printf((info) => `${info.timestamp} [${info.level.toLocaleUpperCase()}]: ${info.message}`)
	),
	transports: [
		new transports.File({ filename: 'logs/error.log', level: 'error' }),
		new transports.File({ filename: 'logs/combined.log' }),
		new transports.Console()
	]
});
