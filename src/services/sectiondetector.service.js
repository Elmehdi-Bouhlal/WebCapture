import config from '../../config/index.js';

class SectionDetector {
  static getDetectScript() {
    return () => {
      const BLOCK_TAGS = new Set(['nav', 'footer', 'header', 'script', 'style', 'noscript', 'link', 'meta', 'head']);
      const NAV_KW = ['nav', 'navbar', 'footer', 'header', 'menu', 'topbar', 'breadcrumb', 'sidebar'];

      function isNavLike(el) {
        const cls = (el.className || '').toString().toLowerCase();
        const id = (el.id || '').toLowerCase();
        return NAV_KW.some((kw) => cls.includes(kw) || id.includes(kw));
      }
      function isVisible(el) {
        const r = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        return (
          r.height > 80 &&
          r.width > 300 &&
          cs.display !== 'none' &&
          cs.visibility !== 'hidden' &&
          parseFloat(cs.opacity) > 0
        );
      }
      function shouldSkip(el) {
        if (BLOCK_TAGS.has(el.tagName.toLowerCase())) return true;
        if (isNavLike(el)) return true;
        const r = el.getBoundingClientRect();
        if (r.top < 80 && r.height < 120) return true;
        return false;
      }
      function visibleChildren(parent) {
        return Array.from(parent.children).filter((el) => !shouldSkip(el) && isVisible(el));
      }
      function dedup(pool) {
        pool = pool.filter((el) => !pool.some((o) => o !== el && o.contains(el)));
        const seen = new Set();
        return pool.filter((el) => {
          const r = el.getBoundingClientRect();
          const key = `${Math.round(r.top)}_${Math.round(r.height)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      function strategy0() {
        const SELECTORS = config.website_scrapper.SPECIAL_SELECTORS;
        for (const sel of SELECTORS) {
          try {
            const els = Array.from(document.querySelectorAll(sel)).filter((el) => !shouldSkip(el) && isVisible(el));
            if (els.length >= 2) return dedup(els);
          } catch {
            /* invalid selector */
          }
        }
        return [];
      }
      function strategy1() {
        const container = document.querySelector('main') || document.querySelector('article');
        let pool = container ? visibleChildren(container) : [];
        const topLevel = Array.from(
          document.body.querySelectorAll('body > section, body > article, body > div > section, body > div > article'),
        ).filter((el) => !shouldSkip(el) && isVisible(el));
        pool = [...new Set([...pool, ...topLevel])];
        return dedup(pool);
      }
      function strategy2() {
        const SPA_ROOTS = [
          '#__next',
          '#root',
          '#app',
          '#__nuxt',
          '#gatsby-focus-wrapper',
          '#___gatsby',
          '[data-reactroot]',
        ];
        for (const sel of SPA_ROOTS) {
          const wrapper = document.querySelector(sel);
          if (!wrapper) continue;
          let pool = visibleChildren(wrapper);
          if (pool.length >= 3) return dedup(pool);
          if (pool.length === 1) {
            pool = visibleChildren(pool[0]);
            if (pool.length >= 3) return dedup(pool);
            if (pool.length > 0) {
              const deeper = pool.flatMap((el) => visibleChildren(el));
              if (deeper.length >= 3) return dedup(deeper);
            }
          }
        }
        const bodyPool = visibleChildren(document.body);
        if (bodyPool.length >= 2) return dedup(bodyPool);
        if (bodyPool.length === 1) {
          const l2 = visibleChildren(bodyPool[0]);
          if (l2.length >= 2) return dedup(l2);
          if (l2.length === 1) return dedup(visibleChildren(l2[0]));
        }
        return dedup(bodyPool);
      }
      function strategy3() {
        const all = Array.from(document.body.querySelectorAll('*')).filter((el) => {
          if (shouldSkip(el)) return false;
          const r = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          return r.height > 120 && r.width > window.innerWidth * 0.65 && cs.display !== 'none';
        });
        return dedup(
          all.filter((el) => {
            const cs = window.getComputedStyle(el);
            const parentCs = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
            const bg = cs.backgroundColor;
            const parentBg = parentCs ? parentCs.backgroundColor : null;
            const hasPad = parseInt(cs.paddingTop, 10) > 30 || parseInt(cs.paddingBottom, 10) > 30;
            const colorDiff = bg !== parentBg && bg !== 'rgba(0, 0, 0, 0)';
            return hasPad || colorDiff;
          }),
        );
      }
      function strategy4() {
        const totalH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const slices = [];
        let y = 0;
        while (y < totalH) {
          slices.push({ synthetic: true, top: y, height: Math.min(window.innerHeight, totalH - y) });
          y += window.innerHeight;
        }
        return slices;
      }

      const strats = [strategy0, strategy1, strategy2, strategy3];
      let pool = [],
        strategyUsed = 4;
      for (let i = 0; i < strats.length; i++) {
        const result = strats[i]();
        if (result.length >= 3) {
          pool = result;
          strategyUsed = i;
          break;
        }
        if (result.length > pool.length) {
          pool = result;
          strategyUsed = i;
        }
      }

      if (pool.length > 0) {
        pool.forEach((el, i) => el.setAttribute('data-capture-index', String(i)));
        return pool.map((el, i) => ({
          synthetic: false,
          captureIndex: i,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          cls: (el.className || '').toString().slice(0, 120),
          strategyUsed,
        }));
      }
      return strategy4().map((s, i) => ({
        synthetic: true,
        captureIndex: i,
        top: s.top,
        height: s.height,
        tag: 'viewport-slice',
        id: null,
        cls: '',
        strategyUsed: 4,
      }));
    };
  }
}

export default new SectionDetector();