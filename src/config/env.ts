import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
	PORT: get('PORT').required().asPortNumber(),
	NODE_ENV: get('NODE_ENV').default('development').asString(),
	PRIVATE_KEY: get('PRIVATE_KEY').required().asString(),
	APP_SECRET: get('APP_SECRET').required().asString(),
	PASSPHRASE: get('PASSPHRASE').default('').asString(),
	WEBHOOK_VERIFY_TOKEN: get('WEBHOOK_VERIFY_TOKEN').required().asString(),
	GRAPH_API_TOKEN: get('GRAPH_API_TOKEN').required().asString(),
	GRAPH_API_VERSION: get('GRAPH_API_VERSION').default('v20.0').asString()
};
