// Has to be the very first import, as other modules read process.env while loading
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Daily reset and news dates are calculated in UTC
process.env.TZ = 'Etc/UTC';
