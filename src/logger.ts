import log4js from 'log4js';
import { settings } from './settings.js';

log4js.configure({
  appenders: {
    console: { type: 'console', layout: { type: 'colored' } },
    errFile: { type: 'file', filename: 'errors.log' },
    errors: { type: 'logLevelFilter', appender: 'errFile', level: 'error' },
  },
  categories: {
    default: { appenders: ['console', 'errors'], level: 'debug' },
  },
  pm2: settings.isProd,
});

export const getLogger = (category: string) => log4js.getLogger(category);

// Flushes pending log writes (e.g. to errors.log), call before exiting the process
export const shutdownLogger = () => new Promise<void>((resolve) => log4js.shutdown(() => resolve()));
