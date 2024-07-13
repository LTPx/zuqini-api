import { envs } from './config/env';
import { AppRoutes } from './routes';
import { Server } from './server';

// This is a test server for testing purposes
export const testServer = new Server({
	port: envs.PORT,
	routes: AppRoutes.routes
});
