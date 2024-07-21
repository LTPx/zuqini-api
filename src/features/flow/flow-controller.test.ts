import request from 'supertest';
import { testServer } from '../../testServer';
import { HttpCode } from '../../constants';
import { decryptRequest, encryptResponse } from '../../utils/encryption';
import { isRequestSignatureValid } from '../../utils';
import { FlowEndpointException } from '../../errors';
import { envs } from '../../config/env';
import { logger } from '../../utils';
import { DecryptedBody, FlowActions } from '../../types';
import { FlowController } from './flow-controller';

jest.mock('../../utils/logger');
jest.mock('../../utils/encryption');
jest.mock('../../utils');
jest.mock('../../config/env');
jest.mock('../../errors');

describe('FlowController', () => {
	beforeEach(async () => {
		await testServer.start();
	});
	afterEach(() => {
		testServer.close();
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return 200 and response for valid POST /flow', async () => {
		(envs.PRIVATE_KEY as string) = 'privateKey';
		(envs.PASSPHRASE as string) = 'passphrase';
		(isRequestSignatureValid as jest.Mock).mockReturnValue(true);
		(decryptRequest as jest.Mock).mockReturnValue({
			aesKeyBuffer: Buffer.from('aesKey'),
			initialVectorBuffer: Buffer.from('initialVector'),
			decryptedBody: {
				action: 'ping',
				screen: '1',
				data: {},
				version: '1.0'
			}
		});
		(encryptResponse as jest.Mock).mockReturnValue('encryptedResponse');

		const response = await request(testServer.app).post('/flow').send({
			encrypted_aes_key: 'test_aes_key',
			encrypted_flow_data: 'test_flow_data',
			initial_vector: 'test_initial_vector'
		});

		expect(response.status).toBe(200);
		expect(response.text).toBe('encryptedResponse');
	});

	it('should return 401 if request signature is invalid', async () => {
		(isRequestSignatureValid as jest.Mock).mockReturnValue(false);

		const response = await request(testServer.app).post('/flow').send({
			encrypted_aes_key: 'test_aes_key',
			encrypted_flow_data: 'test_flow_data',
			initial_vector: 'test_initial_vector'
		});

		expect(response.status).toBe(HttpCode.REQUEST_SIGNATURE_AUTHENTICATION_FAILS);
		expect(response.body).toEqual({ message: 'Request signature does not match' });
	});

	it('should return 500 if private key is missing', async () => {
		(envs.PRIVATE_KEY as string) = '';

		const response = await request(testServer.app).post('/flow').send({
			encrypted_aes_key: 'test_aes_key',
			encrypted_flow_data: 'test_flow_data',
			initial_vector: 'test_initial_vector'
		});

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ message: 'Private key is empty.' });
	});

	it('should return 421 if decryption fails', async () => {
		(envs.PRIVATE_KEY as string) = 'privateKey';
		(envs.PASSPHRASE as string) = 'passphrase';
		(isRequestSignatureValid as jest.Mock).mockReturnValue(true);
		(decryptRequest as jest.Mock).mockImplementation(() => {
			throw new FlowEndpointException('Failed to decrypt the request.');
		});

		const response = await request(testServer.app).post('/flow').send({
			encrypted_aes_key: 'test_aes_key',
			encrypted_flow_data: 'test_flow_data',
			initial_vector: 'test_initial_vector'
		});

		expect(response.status).toBe(421);
		expect(response.body).toEqual({ message: 'Failed to decrypt the request.' });
	});

	it('should handle GET /flow', async () => {
		const response = await request(testServer.app).get('/flow');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: 'Please use POST method to send message to WhatsApp.' });
	});
});

describe('FlowController > getNextScreen', () => {
	it('should return active status for PING action', () => {
		const decryptedBody: DecryptedBody = {
			action: FlowActions.PING,
			screen: '1',
			data: {},
			version: '1.0',
			flow_token: 'flow_token'
		};

		const result = FlowController['getNextScreen'](decryptedBody);
		expect(result).toEqual({
			version: '1.0',
			data: {
				status: 'active'
			}
		});
	});

	it('should return acknowledged for error notification', () => {
		const decryptedBody: DecryptedBody = {
			action: FlowActions.DATA_EXCHANGE,
			screen: '1',
			data: { error: 'Some error' },
			version: '1.0',
			flow_token: 'flow_token'
		};

		const result = FlowController['getNextScreen'](decryptedBody);
		expect(result).toEqual({
			version: '1.0',
			data: {
				acknowledged: true
			}
		});
	});

	it('should handle initial request when opening the flow', () => {
		const decryptedBody: DecryptedBody = {
			action: FlowActions.INIT,
			screen: '1',
			data: {},
			version: '1.0',
			flow_token: 'flow_token'
		};

		const result = FlowController['getNextScreen'](decryptedBody);
		expect(result).toEqual({
			version: '1.0',
			data: {
				// TODO: Add the initial screen data
			}
		});
	});

	it('should handle screen 1 in DATA_EXCHANGE action', () => {
		const decryptedBody: DecryptedBody = {
			action: FlowActions.DATA_EXCHANGE,
			screen: '1',
			data: {},
			version: '1.0',
			flow_token: 'flow_token'
		};

		const result = FlowController['getNextScreen'](decryptedBody);
		expect(result).toEqual({
			version: '1.0',
			data: {
				// TODO: Add the data for screen 1
			}
		});
	});

	it('should handle screen 2 in DATA_EXCHANGE action', () => {
		const decryptedBody: DecryptedBody = {
			action: FlowActions.DATA_EXCHANGE,
			screen: '2',
			data: {},
			version: '1.0',
			flow_token: 'flow_token'
		};

		const result = FlowController['getNextScreen'](decryptedBody);
		expect(result).toEqual({
			version: '1.0',
			data: {
				// TODO: Add the data for screen 2
			}
		});
	});

	it('should throw an error for unhandled request body', () => {
		const decryptedBody: DecryptedBody = {
			// @ts-ignore
			action: 'UNKNOWN_ACTION',
			screen: '1',
			data: {},
			version: '1.0',
			flow_token: 'flow_token'
		};

		expect(() => FlowController['getNextScreen'](decryptedBody)).toThrow(
			'Unhandled endpoint request. Make sure you handle the request action & screen.'
		);
		expect(logger.error).toHaveBeenCalledWith(`Unhandled request body: ${JSON.stringify(decryptedBody)}`);
	});
});
