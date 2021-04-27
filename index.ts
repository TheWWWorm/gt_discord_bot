// READ params from .env file
import dotenv from 'dotenv';
dotenv.config();
import { start } from './bot/init';
start();