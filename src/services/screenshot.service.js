import logger from '../utils/logger.js';
import config from '../../config/index.js';
import StorageService from './storage.service.js';
import SectionDetector from './sectiondetector.service.js';
import MediaExtractor from './mediaextractor.service.js';

class ScreenshotService {
  constructor(page) {
    this.page = page;
  }

  emptyMedia() {
    return {
      background_image: null,
      background_video: null,
      images: [],
      videos: [],
      iframes: [],
    };
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async captureAll(url, captureRequestId) {
    const sectionMetas = await this.page.evaluate(SectionDetector.getDetectScript());
    logger.info({ message: `Detected ${sectionMetas.length} section(s)` });

    const sectionFiles = [];
    let sectionIndex = 0;

    for (const meta of sectionMetas) {
      try {
        const captured = meta.synthetic
          ? await this.captureSyntheticSlice(meta, sectionIndex, captureRequestId)
          : await this.captureElement(meta, sectionIndex, url, captureRequestId);

        if (captured) sectionFiles.push(...captured);
        sectionIndex++;
      } catch (err) {
        logger.error({ message: `Error on section-${sectionIndex}: ${err.message}` });
        sectionIndex++;
      }
    }

    logger.info({ message: `Done — ${sectionFiles.length} screenshot(s) uploaded to R2` });
    return sectionFiles;
  }

  async captureSyntheticSlice(meta, index, captureRequestId) {
    await this.page.evaluate((top) => window.scrollTo(0, top), meta.top);
    await this.sleep(600);

    const hasContent = await this.page.evaluate((top) => {
      const probe = Math.min(top + 50, document.body.scrollHeight - 1);
      return document.elementsFromPoint(720, probe).some((e) => !['HTML', 'BODY'].includes(e.tagName));
    }, meta.top);

    if (!hasContent) {
      logger.info({ message: `Skip empty slice-${index}` });
      return null;
    }

    const buffer = await this.page.screenshot({
      encoding: 'binary',
      clip: {
        x: 0,
        y: meta.top,
        width: config.website_scrapper.screen.VIEWPORT_W,
        height: meta.height,
      },
    });

    // upload buffer directly to R2
    const { key } = await StorageService.upload(Buffer.from(buffer), captureRequestId);

    logger.info({ message: `section-${index} uploaded to R2`, key });
    return [{ index, r2Key: key, meta, mediaData: this.emptyMedia() }];
  }

  async captureElement(meta, index, url, captureRequestId) {
    const elHandle = await this.page.$(`[data-capture-index="${meta.captureIndex}"]`);
    if (!elHandle) {
      logger.warn({ message: `Handle not found for section-${index}, skipping` });
      return null;
    }

    await this.page.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }), elHandle);
    await this.sleep(800);

    const bbox = await elHandle.boundingBox();
    if (!bbox || bbox.height < config.website_scrapper.screen.MIN_SECTION_H) {
      logger.warn({ message: `Section-${index} invisible, skipping` });
      return null;
    }

    if (bbox.height > config.website_scrapper.screen.VIEWPORT_H * 2.5) {
      return this.captureTallElement(elHandle, meta, index, url, captureRequestId, bbox);
    }

    const buffer = await elHandle.screenshot({ encoding: 'binary' });
    const mediaData = await this.page.evaluate(MediaExtractor.getExtractScript(), elHandle, url);

    const { key } = await StorageService.upload(Buffer.from(buffer), captureRequestId);

    logger.info({
      message: `section-${index} uploaded to R2`,
      key,
      dimensions: `${Math.round(bbox.width)}×${Math.round(bbox.height)}px`,
    });

    return [{ index, r2Key: key, meta, mediaData }];
  }

  async captureTallElement(elHandle, meta, index, url, captureRequestId, bbox) {
    logger.info({ message: `Section-${index} tall (${Math.round(bbox.height)}px) — splitting` });
    const results = [];
    let subY = bbox.y;
    let subIdx = 0;

    while (subY < bbox.y + bbox.height) {
      const subH = Math.min(config.website_scrapper.screen.VIEWPORT_H, bbox.y + bbox.height - subY);

      await this.page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 50)), subY);
      await this.sleep(400);

      const buffer = await this.page.screenshot({
        encoding: 'binary',
        clip: {
          x: Math.round(bbox.x),
          y: Math.round(subY),
          width: Math.round(bbox.width),
          height: Math.round(subH),
        },
      });

      const { key } = await StorageService.upload(Buffer.from(buffer), captureRequestId);

      results.push({
        index: index + subIdx * 0.001,
        r2Key: key,
        meta: { ...meta, tag: `${meta.tag}[sub-${subIdx}]` },
        mediaData:
          subIdx === 0 ? await this.page.evaluate(MediaExtractor.getExtractScript(), elHandle, url) : this.emptyMedia(),
      });

      subY += subH;
      subIdx++;
    }

    return results;
  }
}

export default ScreenshotService;
