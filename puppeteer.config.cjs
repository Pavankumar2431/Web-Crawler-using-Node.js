import { join } from 'path';

/**
 * @type {import("puppeteer").Configuration}
 */
const config = {
  cacheDirectory: join(new URL('.', import.meta.url).pathname, '.cache', 'puppeteer'),
};

export default config;
