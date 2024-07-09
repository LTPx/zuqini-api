import { envs } from './config/env';
import { AppRoutes } from './routes';
import { Server } from './server';

(() => {
	main();
})();

function main(): void {
	const server = new Server({
		port: envs.PORT,
		routes: AppRoutes.routes
	});
	void server.start();
}
