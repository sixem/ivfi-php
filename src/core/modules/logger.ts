/** Config */
import { config } from '../config/config';

const logger: {
	condition: boolean;
} = {
	condition: config.get('debug')
};

/* Logging function */
export const log = (title: string, ...message: any): void =>
{
	if(logger.condition)
	{
		console.log(`[${title.toUpperCase()}]`, ...message);
	}
};