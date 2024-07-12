import crypto from 'crypto';
import { decryptRequest, encryptResponse } from './encryption'; // Adjust the path as needed
import { logger } from './logger';
import { FlowEndpointException } from '../errors';

jest.mock('crypto');
jest.mock('./logger');
jest.mock('../errors', () => {
	return {
		FlowEndpointException: jest.fn()
	};
});

describe('decryptRequest', () => {
	it('should decrypt the request successfully', () => {
		const body = {
			encrypted_aes_key: 'encryptedAesKeyBase64',
			encrypted_flow_data: 'encryptedFlowDataBase64',
			initial_vector: 'initialVectorBase64'
		};
		const privatePem = 'privatePemContent';
		const passphrase = 'passphrase';

		const decryptedAesKey = Buffer.from('decryptedAesKey');
		const decryptedJSONString = '{"key": "value"}';

		(crypto.createPrivateKey as jest.Mock).mockReturnValue('privateKey');
		(crypto.privateDecrypt as jest.Mock).mockReturnValue(decryptedAesKey);
		(crypto.createDecipheriv as jest.Mock).mockReturnValue({
			update: jest.fn().mockReturnValue(Buffer.from(decryptedJSONString)),
			final: jest.fn().mockReturnValue(Buffer.from('')),
			setAuthTag: jest.fn()
		});

		const result = decryptRequest(body, privatePem, passphrase);
		const expectedResult = {
			decryptedBody: { key: 'value' },
			aesKeyBuffer: decryptedAesKey,
			initialVectorBuffer: Buffer.from('initialVectorBase64', 'base64')
		};
		expect(result).toEqual(expectedResult);
	});

	it('should throw an error if decryption fails', () => {
		const body = {
			encrypted_aes_key: 'encryptedAesKeyBase64',
			encrypted_flow_data: 'encryptedFlowDataBase64',
			initial_vector: 'initialVectorBase64'
		};
		const privatePem = 'privatePemContent';
		const passphrase = 'passphrase';

		(crypto.createPrivateKey as jest.Mock).mockReturnValue('privateKey');
		(crypto.privateDecrypt as jest.Mock).mockImplementation(() => {
			throw new Error('Decryption failed');
		});

		expect(() => decryptRequest(body, privatePem, passphrase)).toThrow(FlowEndpointException);
		expect(logger.error).toHaveBeenCalledWith(new Error('Decryption failed'));
		expect(FlowEndpointException).toHaveBeenCalledWith(
			'Failed to decrypt the request. Please verify your private key.'
		);
	});
});

describe('encryptResponse', () => {
	it('should encrypt the response successfully', () => {
		const response = { version: '1.0', screen: 'test', data: {} };
		const aesKeyBuffer = Buffer.from('aesKeyBufferContent');
		const initialVectorBuffer = Buffer.from('initialVectorBufferContent');

		const flippedIv = initialVectorBuffer.map((byte) => ~byte);
		const encryptedResponse = 'encryptedResponseBase64';

		(crypto.createCipheriv as jest.Mock).mockReturnValue({
			update: jest.fn().mockReturnValue(Buffer.from('encryptedData')),
			final: jest.fn().mockReturnValue(Buffer.from('finalData')),
			getAuthTag: jest.fn().mockReturnValue(Buffer.from('authTag'))
		});

		const result = encryptResponse(response, aesKeyBuffer, initialVectorBuffer);
		const expectedResult = Buffer.concat([
			Buffer.from('encryptedData'),
			Buffer.from('finalData'),
			Buffer.from('authTag')
		]).toString('base64');
		expect(result).toBe(expectedResult);
	});
});
