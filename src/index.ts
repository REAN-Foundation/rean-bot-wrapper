import * as dotenv from 'dotenv';
import Application from './app.js';
dotenv.config();

(async () => {
    const app = Application.instance();
    await app.start();
})();
