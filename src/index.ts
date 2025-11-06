import * as dotenv from 'dotenv';
dotenv.config();

import Application from './app.js';

(async () => {
    const app = Application.instance();
    await app.start();
})();
