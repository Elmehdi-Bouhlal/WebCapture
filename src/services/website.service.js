import https from 'https';
import http from 'http';

class WebsiteService {

  async isReachable(url) {
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        resolve(res.statusCode < 500);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.on('error', () => {
        resolve(false);
      });
    });
  }

}

export default new WebsiteService();