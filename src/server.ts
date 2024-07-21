import express, { Router, type Request, type Response } from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { type Server as ServerHttp, type IncomingMessage, type ServerResponse } from 'http';

import { HttpCode, ONE_HUNDRED, ONE_THOUSAND, SIXTY } from './constants';
import { logger } from './utils/logger';
import { IncomingMessageExt, ServerOptions } from './types';

export class Server {
	public readonly app = express();
	private readonly port: number;
	private readonly routes: Router;
	private serverListener?: ServerHttp<typeof IncomingMessage, typeof ServerResponse>;

	constructor(options: ServerOptions) {
		const { port, routes } = options;
		this.port = port;
		this.routes = routes;
	}

	async start(): Promise<void> {
		// Middlewares
		this.app.use(
			express.json({
				// store the raw request body to use it for signature verification
				verify: (req, res, buf, encoding) => {
					(req as IncomingMessageExt).rawBody = buf?.toString((encoding as BufferEncoding) || 'utf8');
				}
			})
		); // parse json in request body (allow raw)
		this.app.use(express.urlencoded({ extended: true })); // allow x-www-form-urlencoded
		this.app.use(compression());
		// Limit repeated requests to public APIs
		this.app.use(
			rateLimit({
				max: ONE_HUNDRED,
				windowMs: SIXTY * SIXTY * ONE_THOUSAND,
				message: 'Too many requests from this IP, please try again in one hour'
			})
		);

		// Logger middleware
		this.app.use((req, res, next) => {
			const time = new Date(Date.now()).toString();
			logger.info(`${req.method} ${req.hostname} ${req.path} ${time}`);
			next();
		});

		// Test rest api
		this.app.get('/', (_req: Request, res: Response) => {
			return res.status(HttpCode.OK).send({
				message: 'API is working!!'
			});
		});

		// Routes
		this.app.use(this.routes);

		// Handle not found routes in /api/v1/* (only if 'Public content folder' is not available)
		this.routes.all('*', (req: Request, res: Response): void => {
			res.status(HttpCode.NOT_FOUND).send({
				message: `Cant find ${req.originalUrl} on this server!`
			});
		});

		this.serverListener = this.app.listen(this.port, () => {
			logger.info(`Server running on port ${this.port}...`);
		});
	}

	close(): void {
		this.serverListener?.close();
	}
}
