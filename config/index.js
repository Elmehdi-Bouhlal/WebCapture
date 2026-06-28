import dotenv from 'dotenv';
dotenv.config();

export default {
  app: {
    port: process.env.PORT || 3002,
    env: process.env.NODE_ENV || 'dev',
    flareSolver: process.env.FLARE_SOLVER,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT,
  },
  website_scrapper: {
    screen: {
      VIEWPORT_W: 1440,
      VIEWPORT_H: 900,
      MIN_SECTION_H: 80,
    },
    CONSENT_DOMAINS: [
      'cookiebot.com',
      'onetrust.com',
      'cookiepro.com',
      'usercentrics.eu',
      'consentmanager.net',
      'cookieconsent',
      'gdpr-cookie',
      'cookielaw.org',
      'trustarc.com',
      'quantcast.com',
      'didomi.io',
      'cookieinformation.com',
    ],
    SPECIAL_SELECTORS: [
      '.shopify-section',
      '.w-section',
      '.wp-block-group',
      '.elementor-section',
      '.elementor-top-section',
      '.et_pb_section',
      '[data-section-type]',
      '[data-mesh-id]',
      '[data-testid*="section"]',
      '.dnd-section',
    ],
  },
};
