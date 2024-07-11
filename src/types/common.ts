import { Request, Router } from 'express';
import { IncomingMessage } from 'http';

export interface ServerOptions {
	port: number;
	routes: Router;
}

export interface ValidationType {
	fields: string[];
	constraint: string;
}

export interface ErrorResponse {
	name: string;
	message: string;
	validationErrors?: ValidationType[];
	stack?: string;
}

export interface IncomingMessageExt extends IncomingMessage {
	rawBody?: string;
}

export interface RequestExtended extends Request {
	rawBody?: string;
}

export interface EncryptedBody {
	encrypted_aes_key: string;
	encrypted_flow_data: string;
	initial_vector: string;
}

export interface DecryptedBody {
	screen: string;
	data: {
		// TODO Pending to define the type
		error?: string;
	};
	version: string;
	action: 'ping' | 'INIT' | 'data_exchange';
	flow_token: string;
}

export interface ScreenResponse {
	version: string;
	screen: string;
	data: {
		// TODO Pending to define the type
	};
}
