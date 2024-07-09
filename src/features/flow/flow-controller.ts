import { Request, Response } from 'express';
import { HttpCode } from '../../constants';

export class FlowController {
	public static async whatsAppFlow(req: Request, res: Response): Promise<void> {
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
