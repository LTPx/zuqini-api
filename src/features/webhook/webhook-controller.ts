import { Request, Response } from 'express';
import { envs } from '../../config/env';
import { logger } from '../../utils';
import axios from 'axios';
import { HttpCode } from '../../constants';

export class WebhookController {
	public static async listener(req: Request, res: Response): Promise<void> {
		// log incoming messages
		logger.info('Incoming webhook message: ');
		logger.info(JSON.stringify(req.body, null, 2));

		// check if the webhook request contains a message
		// details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
		const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

		// check if the incoming message contains text
		if (message?.type === 'text') {
			// extract the business number to send the reply from it
			const businessPhoneNumberId = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

			// send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
			await axios({
				method: 'POST',
				url: `https://graph.facebook.com/${envs.GRAPH_API_VERSION}/${businessPhoneNumberId}/messages`,
				headers: {
					Authorization: `Bearer ${envs.GRAPH_API_TOKEN}`
				},
				data: {
					// eslint-disable-next-line
					messaging_product: 'whatsapp',
					to: message.from,
					text: { body: 'Echo: ' + message.text.body },
					context: {
						// eslint-disable-next-line
						message_id: message.id // shows the message as a reply to the original user message
					}
				}
			});

			// mark incoming message as read
			await axios({
				method: 'POST',
				url: `https://graph.facebook.com/${envs.GRAPH_API_VERSION}/${businessPhoneNumberId}/messages`,
				headers: {
					Authorization: `Bearer ${envs.GRAPH_API_TOKEN}`
				},
				data: {
					// eslint-disable-next-line
					messaging_product: 'whatsapp',
					status: 'read',
					// eslint-disable-next-line
					message_id: message.id
				}
			});
		}

		res.sendStatus(HttpCode.OK);
	}

	// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
	// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
	public static async validator(req: Request, res: Response): Promise<void> {
		const mode = req.query['hub.mode'];
		const token = req.query['hub.verify_token'];
		const challenge = req.query['hub.challenge'];

		// check the mode and token sent are correct
		if (mode === 'subscribe' && token === envs.WEBHOOK_VERIFY_TOKEN) {
			// respond with 200 OK and challenge token from the request
			res.status(HttpCode.OK).send(challenge);
			logger.info('Webhook verified successfully!');
		} else {
			// respond with '403 Forbidden' if verify tokens do not match
			res.sendStatus(HttpCode.FORBIDDEN);
			logger.error('Failed to verify webhook!');
		}
	}
}
