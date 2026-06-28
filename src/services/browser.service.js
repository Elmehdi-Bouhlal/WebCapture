import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

class BrowserService {
    constructor() {
        this.browserInstance = null;
    }

    async getBrowser() {
        if (this.browserInstance && this.browserInstance.isConnected()) {
            return this.browserInstance;
        }

        this.browserInstance = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--memory-pressure-off',
                '--max_old_space_size=512',
            ],
        });

        this.browserInstance.on('disconnected', () => {
            this.browserInstance = null;
            logger.info({ message: 'Browser disconnected — will relaunch on next request' });
        });

        logger.info({ message: 'Chrome browser launched (singleton)' });
        return this.browserInstance;
    }

    async newPage() {
        const browser = await this.getBrowser();
        return browser.newPage();
    }
}

export default BrowserService;