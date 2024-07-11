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
