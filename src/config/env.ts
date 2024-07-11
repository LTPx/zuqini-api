import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
	PORT: get('PORT').required().asPortNumber(),
	NODE_ENV: get('NODE_ENV').default('development').asString(),
	PRIVATE_KEY: get('PRIVATE_KEY').required().asString(),
	APP_SECRET: get('APP_SECRET').required().asString()
};
