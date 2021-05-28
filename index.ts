// READ params from .env file
import dotenv from 'dotenv';
dotenv.config();
import log4js from 'log4js'
import config from './config';

process.env.TZ = 'Etc/UTC'

log4js.configure({
  appenders: {
    console: { type: 'console', layout: { type: 'colored' } },
    errFile: {
      type: 'file',
      filename: 'errors.log',
      category: 'errs',
      level: 'error',
    }
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' }
  },
  pm2: config.get('isProd') as boolean
});
// Start the bot
import { start } from './bot/init';
start();