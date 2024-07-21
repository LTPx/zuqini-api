import request from 'supertest';
import { testServer } from '../../testServer';

// Mock the FlowController methods
jest.mock('./flow-controller', () => ({
	FlowController: {
		whatsAppFlow: jest.fn((req, res) => res.status(200).send({ message: 'Flow processed' })),
		info: jest.fn((req, res) =>
			res.status(200).send({ message: 'Please use POST method to send message to WhatsApp.' })
		)
	}
}));

describe('FlowRoutes', () => {
	beforeEach(async () => {
		await testServer.start();
	});
	afterEach(() => {
		testServer.close();
	});

	it('should handle POST /flow', async () => {
		const response = await request(testServer.app).post('/flow').send({
			encrypted_aes_key: 'test_aes_key',
			encrypted_flow_data: 'test_flow_data',
			initial_vector: 'test_initial_vector'
		});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: 'Flow processed' });
	});

	it('should handle GET /flow', async () => {
		const response = await request(testServer.app).get('/flow');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: 'Please use POST method to send message to WhatsApp.' });
	});
});
