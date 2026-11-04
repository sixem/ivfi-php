import { config } from '../config/config';

type Level = 'info' | 'debug' | 'warn' | 'error';

const write = (level: Level, scope: string, message: string, ...details: unknown[]): void =>
{
	// Errors remain visible in production; routine diagnostics follow the debug setting.
	if(level !== 'warn' && level !== 'error' && !config.get('debug')) return;
	console[level]('%cIVFi%c %s%c %s',
		'color: #a695d3; font-weight: 600', 'color: #92929c', scope, 'color: inherit', message, ...details);
};

export const log = {
	info: (scope: string, message: string, ...details: unknown[]): void => write('info', scope, message, ...details),
	debug: (scope: string, message: string, ...details: unknown[]): void => write('debug', scope, message, ...details),
	warn: (scope: string, message: string, ...details: unknown[]): void => write('warn', scope, message, ...details),
	error: (scope: string, message: string, ...details: unknown[]): void => write('error', scope, message, ...details)
};
