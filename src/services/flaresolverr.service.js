import logger from '../utils/logger';
import config from '../config';

class FlareSolverrService {
    async getCookies(url) {
        logger.info({ message: `FlareSolverr resolving: ${url}` });

        const res = await fetch(config.app.flareSolver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd: 'request.get', url, maxTimeout: 60000 }),
        });

        if (!res.ok) throw new Error(`FlareSolverr HTTP error: ${res.statusText}`);

        const data = await res.json();
        if (data.status !== 'ok') throw new Error(`FlareSolverr failed: ${data.message}`);

        const { cookies, userAgent } = data.solution;
        logger.info({ message: `Got ${cookies.length} cookie(s)` });
        return { cookies, userAgent };
    }
}

export default new FlareSolverrService();