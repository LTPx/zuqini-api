import { Request, Response } from 'express';
import { HttpCode } from '../../constants';
import { envs } from '../../config/env';
import { AppError, FlowEndpointException } from '../../errors';
import { isRequestSignatureValid, logger } from '../../utils';
import { DecryptedBody, EncryptedBody, ScreenResponse } from '../../types';
import { decryptRequest, encryptResponse } from '../../utils/encryption';

export class FlowController {
	private static getNextScreen(decryptedBody: DecryptedBody): ScreenResponse {
		// TODO Implement logic to get the next screen based on the decrypted body
		const screenResponse: ScreenResponse = {
			version: decryptedBody.version,
			screen: decryptedBody.screen,
			data: {}
		};
		return screenResponse;
	}

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

		let decryptedRequest = null;
		try {
			decryptedRequest = decryptRequest(req.body as EncryptedBody, envs.PRIVATE_KEY, envs.PASSPHRASE);
		} catch (err) {
			logger.error(err);
			if (err instanceof FlowEndpointException) {
				// TODO Check if we can send a body with the response
				AppError.flowEndpointException(err.message);
				return;
			}
			AppError.internalServer('Internal server error. Please check your private key.');
			return;
		}

		const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
		logger.log('💬 Decrypted Request:', decryptedBody);

		// TODO: Uncomment this block and add your flow token validation logic.
		// If the flow token becomes invalid, return HTTP code 427 to disable the flow and show the message in `error_msg` to the user
		// Refer to the docs for details https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes

		/*
    if (!isValidFlowToken(decryptedBody.flow_token)) {
      const error_response = {
        error_msg: `The message is no longer available`,
      };
      return res
        .status(427)
        .send(
          encryptResponse(error_response, aesKeyBuffer, initialVectorBuffer)
        );
    }
    */

		const screenResponse = this.getNextScreen(decryptedBody as DecryptedBody);
		logger.log('👉 Response to Encrypt:', screenResponse);

		res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
	}

	public static async info(req: Request, res: Response): Promise<void> {
		res.status(HttpCode.OK).send({
			message: 'Please use POST method to send message to WhatsApp.'
		});
	}
}
