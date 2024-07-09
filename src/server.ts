import express, { NextFunction, Router, type Request, type Response } from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { HttpCode, ONE_HUNDRED, ONE_THOUSAND, SIXTY } from './constants';
import { logger } from './utils/logger';
import { ServerOptions } from './types';
import { AppError } from './errors';

export class Server {
	private readonly app = express();
	private readonly port: number;
	private readonly routes: Router;

	constructor(options: ServerOptions) {
		const { port, routes } = options;
		this.port = port;
		this.routes = routes;
	}

	async start(): Promise<void> {
		// Middlewares
		this.app.use(express.json()); // parse json in request body (allow raw)
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
		this.routes.all('*', (req: Request, _: Response, next: NextFunction): void => {
			next(AppError.notFound(`Cant find ${req.originalUrl} on this server!`));
		});

		this.app.listen(this.port, () => {
			logger.info(`Server running on port ${this.port}...`);
		});
	}
}
