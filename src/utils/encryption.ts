/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'crypto';
import { EncryptedBody, ScreenResponse } from '../types';
import { logger } from './logger';
import { FlowEndpointException } from '../errors';

export const decryptRequest = (body: EncryptedBody, privatePem: string, passphrase: string) => {
	const {
		encrypted_aes_key: encryptedAesKey,
		encrypted_flow_data: encryptedFlowData,
		initial_vector: initialVector
	} = body;

	const privateKey = crypto.createPrivateKey({ key: privatePem, passphrase });
	let decryptedAesKey = null;
	try {
		// decrypt AES key created by client
		decryptedAesKey = crypto.privateDecrypt(
			{
				key: privateKey,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
				oaepHash: 'sha256'
			},
			Buffer.from(encryptedAesKey, 'base64')
		);
	} catch (error) {
		logger.error(error);
		/*
    Failed to decrypt. Please verify your private key.
    If you change your public key. You need to return HTTP status code 421 to refresh the public key on the client
    */
		throw new FlowEndpointException('Failed to decrypt the request. Please verify your private key.');
	}

	// decrypt flow data
	const flowDataBuffer = Buffer.from(encryptedFlowData, 'base64');
	const initialVectorBuffer = Buffer.from(initialVector, 'base64');

	const TAG_LENGTH = 16;
	const encryptedFlowDataBody = flowDataBuffer.subarray(0, -TAG_LENGTH);
	const encryptedFlowDataTag = flowDataBuffer.subarray(-TAG_LENGTH);

	const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer);
	decipher.setAuthTag(encryptedFlowDataTag);

	const decryptedJSONString = Buffer.concat([decipher.update(encryptedFlowDataBody), decipher.final()]).toString(
		'utf-8'
	);

	return {
		decryptedBody: JSON.parse(decryptedJSONString),
		aesKeyBuffer: decryptedAesKey,
		initialVectorBuffer
	};
};

export const encryptResponse = (response: ScreenResponse, aesKeyBuffer: Buffer, initialVectorBuffer: Buffer) => {
	// flip initial vector
	const flippedIv = [];
	for (const pair of initialVectorBuffer.entries()) {
		flippedIv.push(~pair[1]);
	}

	// encrypt response data
	const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, Buffer.from(flippedIv));
	return Buffer.concat([
		cipher.update(JSON.stringify(response), 'utf-8'),
		cipher.final(),
		cipher.getAuthTag()
	]).toString('base64');
};
