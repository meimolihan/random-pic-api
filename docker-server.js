const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

const IMAGE_REGEX = /\.(webp|jpg|jpeg|png|gif)$/i;
const LANDSCAPE_DIR = path.join(__dirname, 'public', 'landscape');
const PORTRAIT_DIR = path.join(__dirname, 'public', 'portrait');

function scanImages(dir) {
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      return [];
    }
    return fs.readdirSync(dir).filter(f => IMAGE_REGEX.test(f));
  } catch (err) {
    console.error(`Scan failed ${dir}: ${err.message}`);
    return [];
  }
}

function getRandomImage(type) {
  const dir = type === 'landscape' ? LANDSCAPE_DIR : PORTRAIT_DIR;
  const images = scanImages(dir);
  if (images.length === 0) return null;
  return images[Math.floor(Math.random() * images.length)];
}

function serveImage(res, imagePath) {
  const fullPath = path.join(__dirname, 'public', imagePath);
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(fullPath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  fs.createReadStream(fullPath).pipe(res);
}

function detectMobile(ua) {
  return /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
}

function handleApiRequest(req, res, type) {
  const image = getRandomImage(type);
  if (!image) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No images found in ${type}` }));
    return;
  }

  const imageUrl = `/${type}/${image}`;
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const noCache = { 'Cache-Control': 'no-cache, no-store, must-revalidate' };

  if (params.get('type') === 'json') {
    const images = scanImages(type === 'landscape' ? LANDSCAPE_DIR : PORTRAIT_DIR);
    res.writeHead(200, { 'Content-Type': 'application/json', ...noCache });
    res.end(JSON.stringify({ url: imageUrl, type, count: images.length }));
    return;
  }

  serveImage(res, imageUrl);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.replace(/\/$/, '');

  if (pathname === '' || pathname === '/api/index') {
    const type = detectMobile(req.headers['user-agent'] || '') ? 'portrait' : 'landscape';
    handleApiRequest(req, res, type);
  } else if (pathname === '/pc' || pathname === '/api/pc') {
    handleApiRequest(req, res, 'landscape');
  } else if (pathname === '/mobile' || pathname === '/api/mobile') {
    handleApiRequest(req, res, 'portrait');
  } else if (pathname.startsWith('/landscape/') || pathname.startsWith('/portrait/')) {
    serveImage(res, pathname);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  const publicHost = process.env.PUBLIC_HOST || `http://0.0.0.0:${PORT}`;
  console.log(`Random Pic API running on ${publicHost}`);
  console.log(`Landscape: ${scanImages(LANDSCAPE_DIR).length} images`);
  console.log(`Portrait: ${scanImages(PORTRAIT_DIR).length} images`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  ${publicHost}/       - Auto-detect (mobile/desktop)`);
  console.log(`  ${publicHost}/pc     - Random landscape`);
  console.log(`  ${publicHost}/mobile - Random portrait`);
  console.log('  ?type=json   - JSON response');
  console.log('');
  console.log('Tip: docker restart random-pic-api after adding new images');
});
