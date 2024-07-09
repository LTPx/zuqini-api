import { Router } from 'express';
import { FlowRoutes } from './features/flow';

export class AppRoutes {
	static get routes(): Router {
		const router = Router();
		router.use('/', FlowRoutes.routes);
		return router;
	}
}
