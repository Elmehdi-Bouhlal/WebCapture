class MediaExtractor {
    // Runs entirely inside the browser via page.evaluate()
    static getExtractScript() {
        return (el, pageUrl) => {
            function toAbs(src) {
                if (!src || src.startsWith('data:')) return src;
                try { return new URL(src, pageUrl).href; } catch { return src; }
            }
            function parseBg(bg) {
                if (!bg || bg === 'none') return null;
                const m = bg.match(/url\(["']?(.*?)["']?\)/);
                return m ? toAbs(m[1]) : null;
            }
            function walk(root) {
                const res = [];
                const w   = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                let n = w.currentNode;
                while (n) { res.push(n); n = w.nextNode(); }
                return res;
            }

            const all      = walk(el);
            const bgImages = [], bgSeen  = new Set();
            const images   = [], imgSeen = new Set();
            const videos   = [], vidSeen = new Set();
            const iframes  = [], ifrSeen = new Set();
            let bgVideo = null;

            for (const e of all) {
                for (const src of [
                    parseBg(window.getComputedStyle(e).backgroundImage),
                    parseBg(e.style.backgroundImage),
                ]) {
                    if (src && !bgSeen.has(src)) { bgImages.push(src); bgSeen.add(src); }
                }
                if (e.tagName === 'IMG') {
                    const src = e.src || e.getAttribute('data-src') || e.getAttribute('data-lazy-src');
                    if (src) {
                        const a = toAbs(src);
                        if (!imgSeen.has(a)) { images.push(a); imgSeen.add(a); }
                    }
                }
                if (e.tagName === 'VIDEO') {
                    const isBg = e.hasAttribute('autoplay') && e.hasAttribute('muted');
                    const srcs = [e.src, ...[...e.querySelectorAll('source')].map((s) => s.src)].filter(Boolean);
                    for (const s of srcs) {
                        const a = toAbs(s);
                        if (isBg && !bgVideo) bgVideo = a;
                        if (!vidSeen.has(a)) { videos.push(a); vidSeen.add(a); }
                    }
                }
                if (e.tagName === 'IFRAME' && e.src && e.src !== 'about:blank') {
                    const a = toAbs(e.src);
                    if (!ifrSeen.has(a)) { iframes.push(a); ifrSeen.add(a); }
                }
            }

            const sectionBg = parseBg(window.getComputedStyle(el).backgroundImage) || parseBg(el.style.backgroundImage);
            return {
                background_image:  sectionBg || bgImages[0] || null,
                background_video:  bgVideo,
                images, videos, iframes,
            };
        };
    }
}

export default new MediaExtractor();