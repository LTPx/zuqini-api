import { Server } from './server';
import { envs } from './config/env';

jest.mock('./server');

describe('tests in app.ts', () => {
	test('should call server with correct arguments and start it', async () => {
		await import('./app');
		expect(Server).toHaveBeenCalledTimes(1);
		expect(Server).toHaveBeenCalledWith({
			port: envs.PORT,
			routes: expect.any(Function)
		});
	});
});
