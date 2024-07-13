import request from 'supertest';
import { testServer } from './testServer';

describe('Root endpoint', () => {
	beforeAll(async () => {
		await testServer.start();
	});
	afterAll(() => {
		testServer.close();
	});
	test('should return API is working!!', async () => {
		const res = await request(testServer.app).get('/');
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({
			message: 'API is working!!'
		});
	});
});
