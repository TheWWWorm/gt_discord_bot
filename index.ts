// READ params from .env file
import { config as dotEvnConfig } from 'dotenv';
dotEvnConfig();
import { configure } from 'log4js';
import config from './config';

process.env.TZ = 'Etc/UTC'

configure({
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