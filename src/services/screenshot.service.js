import logger from '../utils/logger';
import config from '../../config/index.js'
import fs from 'fs';
import path from 'path';

class ScreenshotService {
    constructor(page) {
        this.page = page;
    }

    emptyMedia() {
        return { background_image: null, background_video: null, images: [], videos: [], iframes: [] };
    }

    sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    async captureAll(url, outDir) {
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const sectionMetas = await this.page.evaluate(SectionDetector.getDetectScript());
        logger.info({ message: `Detected ${sectionMetas.length} section(s)` });

        const sectionFiles = [];
        let sectionIndex   = 0;

        for (const meta of sectionMetas) {
            try {
                const captured = meta.synthetic
                    ? await this.captureSyntheticSlice(meta, sectionIndex, outDir)
                    : await this.captureElement(meta, sectionIndex, url, outDir);

                if (captured) sectionFiles.push(...captured);
                sectionIndex++;
            } catch (err) {
                logger.error({ message: `Error on section-${sectionIndex}: ${err.message}` });
                sectionIndex++;
            }
        }

        logger.info({ message: `Done — ${sectionFiles.length} screenshot(s) saved` });
        return sectionFiles;
    }

    async captureSyntheticSlice(meta, index, outDir) {
        await this.page.evaluate((top) => window.scrollTo(0, top), meta.top);
        await this.sleep(600);

        const hasContent = await this.page.evaluate((top) => {
            const probe = Math.min(top + 50, document.body.scrollHeight - 1);
            return document.elementsFromPoint(720, probe)
                .some((e) => !['HTML', 'BODY'].includes(e.tagName));
        }, meta.top);

        if (!hasContent) {
            logger.info({ message: `Skip empty slice-${index}` });
            return null;
        }

        const filePath = path.join(outDir, `section-${index}.png`);
        await this.page.screenshot({
            path: filePath,
            clip: { x: 0, y: meta.top, width: config.website_scrapper.screen.VIEWPORT_W, height: meta.height },
        });

        logger.info({ message: `section-${index}.png [viewport-slice]` });
        return [{ index, filePath, meta, mediaData: this.emptyMedia() }];
    }

    async captureElement(meta, index, url, outDir) {
        const elHandle = await this.page.$(`[data-capture-index="${meta.captureIndex}"]`);
        if (!elHandle) {
            logger.warn({ message: `Handle not found for section-${index}, skipping` });
            return null;
        }

        await this.page.evaluate(
            (el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }),
            elHandle,
        );
        await this.sleep(800);

        const bbox = await elHandle.boundingBox();
        if (!bbox || bbox.height < config.website_scrapper.screen.MIN_SECTION_H) {
            logger.warn({ message: `Section-${index} invisible, skipping` });
            return null;
        }

        // Tall section → split
        if (bbox.height > config.website_scrapper.screen.VIEWPORT_H * 2.5) {
            return this.captureTallElement(elHandle, meta, index, url, outDir, bbox);
        }

        // Normal section
        const filePath  = path.join(outDir, `section-${index}.png`);
        const mediaData = await this.page.evaluate(MediaExtractor.getExtractScript(), elHandle, url);
        await elHandle.screenshot({ path: filePath });

        logger.info({ message: `section-${index}.png <${meta.tag}> ${Math.round(bbox.width)}×${Math.round(bbox.height)}px` });
        return [{ index, filePath, meta, mediaData }];
    }

    async captureTallElement(elHandle, meta, index, url, outDir, bbox) {
        logger.info({ message: `Section-${index} tall (${Math.round(bbox.height)}px) — splitting` });
        const results = [];
        let subY = bbox.y, subIdx = 0;

        while (subY < bbox.y + bbox.height) {
            const subH    = Math.min(config.website_scrapper.screen.VIEWPORT_H, bbox.y + bbox.height - subY);
            const subPath = path.join(outDir, `section-${index}-${subIdx}.png`);

            await this.page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 50)), subY);
            await this.sleep(400);

            await this.page.screenshot({
                path: subPath,
                clip: {
                    x:      Math.round(bbox.x),
                    y:      Math.round(subY),
                    width:  Math.round(bbox.width),
                    height: Math.round(subH),
                },
            });

            results.push({
                index: index + subIdx * 0.001,
                filePath: subPath,
                meta: { ...meta, tag: `${meta.tag}[sub-${subIdx}]` },
                mediaData: subIdx === 0
                    ? await this.page.evaluate(MediaExtractor.getExtractScript(), elHandle, url)
                    : this.emptyMedia(),
            });

            subY += subH;
            subIdx++;
        }

        return results;
    }
}

export default new ScreenshotService();