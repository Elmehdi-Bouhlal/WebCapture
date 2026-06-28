import config from '../../config/index.js';
import logger from '../utils/logger.js';

class PageService {
  constructor(page) {
    this.page = page;
  }

  async configure(cookies, userAgent) {
    await this.page.setUserAgent(userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await this.page.setViewport({
      width: config.website_scrapper.screen.VIEWPORT_W,
      height: config.website_scrapper.screen.VIEWPORT_H,
      deviceScaleFactor: 1,
    });

    if (cookies?.length > 0) {
      await this.page.setCookie(
        ...cookies.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path || '/',
          httpOnly: c.httpOnly || false,
          secure: c.secure || false,
          sameSite: c.sameSite || 'Lax',
        })),
      );
      logger.info({ message: `Injected ${cookies.length} cookie(s)` });
    }
  }

  async blockConsentScripts() {
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      const u = req.url().toLowerCase();
      config.website_scrapper.CONSENT_DOMAINS.some((d) => u.includes(d)) ? req.abort() : req.continue();
    });
    logger.info({ message: 'Consent scripts blocked' });
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    logger.info({ message: `Navigated to ${url}` });
  }

  async dismissPopups() {
    try {
      await this.page.evaluate(() => {
        const WORDS = [
          'accept',
          'agree',
          'ok',
          'close',
          'dismiss',
          'continue',
          'got it',
          'i understand',
          'accepter',
          'autoriser',
          'allow',
        ];
        document.querySelectorAll('*').forEach((el) => {
          const cs = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const isOverlay =
            (cs.position === 'fixed' || cs.position === 'absolute') &&
            rect.width > window.innerWidth * 0.3 &&
            rect.height > window.innerHeight * 0.2 &&
            parseInt(cs.zIndex, 10) > 100;
          if (!isOverlay) return;
          for (const btn of el.querySelectorAll('button, a, [role="button"]')) {
            if (WORDS.some((w) => btn.textContent.toLowerCase().includes(w))) {
              btn.click();
              return;
            }
          }
          el.remove();
        });
        document
          .querySelectorAll('.modal-backdrop, .overlay, .popup-overlay, [class*="backdrop"]')
          .forEach((el) => el.remove());
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';
        document.documentElement.style.overflow = 'auto';
      });
    } catch (err) {
      logger.warn({ message: `Popup dismiss warning (non-fatal): ${err.message}` });
    }
  }

  async slowScroll() {
    try {
      await this.page.evaluate(async () => {
        await new Promise((resolve) => {
          let y = 0;
          const step = 250;
          const t = setInterval(() => {
            window.scrollBy(0, step);
            y += step;
            if (y >= document.body.scrollHeight) {
              window.scrollTo(0, 0);
              clearInterval(t);
              resolve();
            }
          }, 120);
        });
      });
    } catch {
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    }
    await this.page.evaluate(() => window.scrollTo(0, 0));
    logger.info({ message: 'Page scrolled — lazy content loaded' });
  }

  async close() {
    await this.page.close();
    logger.info({ message: 'Page closed' });
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export default new PageService();
