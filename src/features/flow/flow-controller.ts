import { Request, Response } from 'express';
import { HttpCode } from '../../constants';
import { envs } from '../../config/env';
import { AppError } from '../../errors';
import { isRequestSignatureValid } from '../../utils';

export class FlowController {
	public static async whatsAppFlow(req: Request, res: Response): Promise<void> {
		if (!envs.PRIVATE_KEY) {
			throw AppError.internalServer('Private key is empty. Please check your env variable "PRIVATE_KEY".');
		}

		if (!isRequestSignatureValid(req)) {
			// Return status code 432 if request signature does not match.
			// To learn more about return error codes visit: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes
			//TODO Check if we can send a body with the response
			res.status(HttpCode.REQUEST_SIGNATURE_AUTHENTICATION_FAILS).send({
				message: 'Request signature does not match'
			});
			return;
		}

		res.status(HttpCode.OK).send({
			message: 'Work in progress...'
		});
	}

	public static async info(req: Request, res: Response): Promise<void> {
		res.status(HttpCode.OK).send({
			message: 'Please use POST method to send message to WhatsApp.'
		});
	}
}
