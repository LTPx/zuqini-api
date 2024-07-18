import { envs } from '../config/env';
import { logger } from './logger';
import crypto from 'crypto';
import { RequestExtended } from '../types';

export const isRequestSignatureValid = (req: RequestExtended) => {
	if (!envs.APP_SECRET) {
		logger.warn('App Secret is not set up. Please Add your app secret in /.env file to check for request validation');
		//TODO Check why true was returned here before
		return false;
	}

	const signatureHeader = req.get('x-hub-signature-256');
	if (!signatureHeader) {
		logger.error('Request Signature Header x-hub-signature-256 is missing');
		return false;
	}

	try {
		const signatureBuffer = Buffer.from(signatureHeader.replace('sha256=', ''), 'utf-8');

		const hmac = crypto.createHmac('sha256', envs.APP_SECRET);
		const digestString = hmac.update(req.rawBody as string).digest('hex');
		const digestBuffer = Buffer.from(digestString, 'utf-8');

		if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
			logger.error('Request Signature did not match');
			return false;
		}
	} catch (error) {
		logger.error(error);
		return false;
	}
	return true;
};
