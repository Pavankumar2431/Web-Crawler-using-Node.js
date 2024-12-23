import express from 'express';
import { Cluster } from 'puppeteer-cluster';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

// Get the directory name from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const FILE_PATH = path.join(__dirname, 'product_urls.csv');
const MAX_DEPTH = 2;
const MAX_SITES = 10;
const MAX_CONCURRENCY = 5;

// Ensure the CSV file exists with a header
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, 'Product URL\n', 'utf8');
}

// Append a product URL to the CSV file
const appendProductUrlToCsv = (url) => {
  fs.appendFileSync(FILE_PATH, `${url}\n`, 'utf8');
};

// Scroll to the bottom of a page to handle infinite scrolling
const scrollToBottom = async (page) => {
  let previousHeight;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);

  do {
    previousHeight = currentHeight;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
  } while (currentHeight > previousHeight);
};

// Extract product links from the current page
const extractProductLinks = async (page) => {
  const productLinkPatterns = [
    '/p/', '/dp/', '/product/', '/itm/', '/b/', '/ecommerce/product/', '/item/', '/en-in/'
  ];

  return await page.$$eval('a', (anchors, patterns) =>
    anchors.map((a) => a.href).filter((link) => patterns.some((pattern) => link.includes(pattern))),
    productLinkPatterns
  );
};

// Crawl a given URL and process its content
const crawl = async ({ page, data }) => {
  const { url, depth, domain, seenUrls } = data;

  if (depth === 0 || seenUrls.has(url)) return;
  seenUrls.add(url);

  try {
    console.log(`Crawling: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Handle infinite scrolling
    await scrollToBottom(page);

    // Extract and save product links
    const productLinks = await extractProductLinks(page);
    productLinks.forEach((link) => {
      console.log(`Product link found: ${link}`);
      appendProductUrlToCsv(link);
    });

    // Extract additional links for further crawling
    const links = await page.$$eval('a', (anchors) =>
      anchors
        .map((a) => a.href)
        .filter((link) =>
          link.startsWith(`https://${domain}`) &&
          !link.includes('/search') &&
          !seenUrls.has(link)
        )
    );

    for (const link of links) {
      console.log(`Queueing link: ${link}`);
      await cluster.queue({ url: link, depth: depth - 1, domain, seenUrls });
    }
  } catch (error) {
    console.error(`Failed to crawl: ${url}`, error);
  }
};

// Main function to handle the crawling process
const main = async (inputSites) => {
  const sitesToCrawl = inputSites.slice(0, MAX_SITES);
  console.log('Sites to crawl:', sitesToCrawl);

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: MAX_CONCURRENCY,
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  cluster.task(crawl);

  for (const site of sitesToCrawl) {
    const domain = new URL(site).hostname;
    const seenUrls = new Set();

    console.log(`Enqueuing site: ${site}`);
    // Queue the initial site for each domain
    await cluster.queue({ url: site, depth: MAX_DEPTH, domain, seenUrls });
  }

  await cluster.idle();
  await cluster.close();
  console.log('Crawling completed. Check product_urls.csv for results.');
};

// POST endpoint to start crawling
app.post('/start-crawl', async (req, res) => {
  const { websites } = req.body;

  if (!websites || !Array.isArray(websites)) {
    return res.status(400).json({ error: 'Please provide an array of website domains.' });
  }

  // Clear the file before starting a new crawl
  try {
    fs.writeFileSync(FILE_PATH, 'Product URL\n', 'utf8');
    console.log('File cleared successfully.');
  } catch (error) {
    console.error('Error clearing the file:', error);
    return res.status(500).json({ error: 'Failed to clear the file.' });
  }

  try {
    await main(websites);
    res.json({
      message: 'Crawling initiated successfully.',
      downloadLink: `${req.protocol}://${req.get('host')}/download-data`,
      viewLink: `${req.protocol}://${req.get('host')}/view-data`,
    });
  } catch (error) {
    console.error('Error during crawl:', error);
    res.status(500).json({ error: 'Failed to start crawling.' });
  }
});

// GET endpoint to download the CSV data
app.get('/download-data', (req, res) => {
  if (!fs.existsSync(FILE_PATH)) {
    return res.status(404).json({ error: 'No data available for download.' });
  }

  res.download(FILE_PATH, 'product_urls.csv');
});

// GET endpoint to view the CSV data as JSON
app.get('/view-data', (req, res) => {
  if (!fs.existsSync(FILE_PATH)) {
    return res.status(404).json({ error: 'No data available to view.' });
  }

  const data = fs
    .readFileSync(FILE_PATH, 'utf8')
    .split('\n')
    .slice(1) // Skip header
    .filter((line) => line) // Remove empty lines
    .map((line) => ({ url: line }));

  res.json(data);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
