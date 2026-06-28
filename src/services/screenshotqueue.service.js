import FlareSolverrService from './flaresolverr.service.js';
import BrowserService from './browser.service.js';
import PageService from './page.service.js';
import ScreenshotService from './screenshot.service.js';

class ScreenshotQueueService {
  constructor() {
    this.flare = new FlareSolverrService();
    this.browser = new BrowserService();
  }

  async capture(url, captureRequestId) {
    const { cookies, userAgent } = await this.flare.getCookies(url);
    const rawPage = await this.browser.newPage();
    const pageService = new PageService(rawPage);

    try {
      await pageService.configure(cookies, userAgent);
      await pageService.blockConsentScripts();
      await pageService.navigate(url);
      await pageService.dismissPopups();
      await pageService.slowScroll();

      const screenshotService = new ScreenshotService(rawPage);
      const sectionFiles = await screenshotService.captureAll(url, captureRequestId);

      return sectionFiles;
    } finally {
      await pageService.close();
      await this.browser.close();
    }
  }
}

export default new ScreenshotQueueService();
