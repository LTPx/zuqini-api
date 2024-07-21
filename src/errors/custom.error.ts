import { HttpCode } from '../constants';

export class FlowEndpointException extends Error {
	statusCode: number;
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = HttpCode.FLOW_ERROR;
	}
}
