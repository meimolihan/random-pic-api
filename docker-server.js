const http = require('http');
const fs = require('fs');
const path = require('path');
const manifest = require('./api/_manifest');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.json': 'application/json',
  '.html': 'text/html',
};

function detectMobile(ua) {
  return /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
}

function getRandomImage(type) {
  const images = manifest[type];
  if (!images || images.length === 0) return null;
  return images[Math.floor(Math.random() * images.length)];
}

function serveImage(res, imagePath) {
  const fullPath = path.join(__dirname, 'public', imagePath);
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(fullPath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'public, max-age=604800',
    'Content-Disposition': 'inline',
  });
  fs.createReadStream(fullPath).pipe(res);
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

  if (params.get('type') === 'json') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(JSON.stringify({ url: imageUrl, type, count: manifest[type].length }));
    return;
  }

  // Directly serve the image (no CDN redirect needed in Docker)
  serveImage(res, imageUrl);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API routes
  if (pathname === '/' || pathname === '/api/index') {
    const type = detectMobile(req.headers['user-agent'] || '') ? 'portrait' : 'landscape';
    handleApiRequest(req, res, type);
  } else if (pathname === '/pc' || pathname === '/api/pc') {
    handleApiRequest(req, res, 'landscape');
  } else if (pathname === '/mobile' || pathname === '/api/mobile') {
    handleApiRequest(req, res, 'portrait');
  } else if (pathname.startsWith('/landscape/') || pathname.startsWith('/portrait/')) {
    // Direct image access
    serveImage(res, pathname);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Random Pic API running on http://0.0.0.0:${PORT}`);
  console.log(`   Landscape: ${manifest.landscape?.length || 0} images`);
  console.log(`   Portrait:  ${manifest.portrait?.length || 0} images`);
});
