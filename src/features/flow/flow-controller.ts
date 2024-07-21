import { Request, Response } from 'express';
import { HttpCode } from '../../constants';
import { envs } from '../../config/env';
import { FlowEndpointException } from '../../errors';
import { isRequestSignatureValid, logger } from '../../utils';
import { DecryptedBody, EncryptedBody, FlowActions, ScreenResponse } from '../../types';
import { decryptRequest, encryptResponse } from '../../utils/encryption';

export class FlowController {
	public static getNextScreen(decryptedBody: DecryptedBody): ScreenResponse {
		const { screen, data, version, action } = decryptedBody;
		// Handle health check request
		if (action === FlowActions.PING) {
			return {
				version,
				data: {
					status: 'active'
				}
			};
		}

		// handle error notification
		if (data?.error) {
			logger.warn(`Received client error: ${data}`);
			return {
				version,
				data: {
					acknowledged: true
				}
			};
		}

		// handle initial request when opening the flow
		if (action === FlowActions.INIT) {
			return {
				version,
				data: {
					// TODO: Add the initial screen data
				}
			};
		}

		if (action === FlowActions.DATA_EXCHANGE) {
			// handle the request based on the current screen
			switch (screen) {
				case '1':
					// TODO
					return {
						version,
						data: {
							// TODO
						}
					};

				case '2':
					// TODO
					return {
						version,
						data: {
							// TODO
						}
					};

				// ...

				default:
					break;
			}
		}

		logger.error(`Unhandled request body: ${JSON.stringify(decryptedBody)}`);
		throw new Error('Unhandled endpoint request. Make sure you handle the request action & screen.');
	}

	public static async whatsAppFlow(req: Request, res: Response): Promise<void> {
		if (!envs.PRIVATE_KEY) {
			logger.error('Private key is empty. Please check your env variable "PRIVATE_KEY".');
			res.status(HttpCode.INTERNAL_SERVER_ERROR).send({ message: 'Private key is empty.' });
			return;
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
				res.status(HttpCode.FLOW_ERROR).send({ message: err.message || 'Failed to decrypt the request.' });
				return;
			}
			res
				.status(HttpCode.INTERNAL_SERVER_ERROR)
				.send({ message: 'Internal server error. Please check your private key.' });
			return;
		}

		const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
		logger.info(`💬 Decrypted Request: ${decryptedBody}`);

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

		try {
			const screenResponse = FlowController.getNextScreen(decryptedBody as DecryptedBody);
			logger.info(`👉 Response to Encrypt: ${screenResponse}`);
			res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
			return;
		} catch (err) {
			logger.error(err);
			res.status(HttpCode.INTERNAL_SERVER_ERROR).send({ message: (err as Error).message });
			return;
		}
	}

	public static async info(req: Request, res: Response): Promise<void> {
		res.status(HttpCode.OK).send({
			message: 'Please use POST method to send message to WhatsApp.'
		});
	}
}
