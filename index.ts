// READ params from .env file
import dotenv from 'dotenv';
dotenv.config();
// Start the bot
import { start } from './bot/init';
start();