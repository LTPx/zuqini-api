import { Router } from 'express';

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
