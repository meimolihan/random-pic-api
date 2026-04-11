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

/**
 * 运行时动态扫描图片目录，返回文件列表
 */
function scanImages(dir) {
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  目录不存在：${dir}`);
      return [];
    }
    const files = fs.readdirSync(dir).filter(f => IMAGE_REGEX.test(f));
    console.log(`📁 ${path.basename(dir)}: ${files.length} 张图片`);
    return files;
  } catch (err) {
    console.error(`❌ 扫描失败 ${dir}: ${err.message}`);
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
    'Cache-Control': 'public, max-age=604800',
    'Content-Disposition': 'inline',
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

  const imageUrl = `${type}/${image}`;
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;

  if (params.get('type') === 'json') {
    const dir = type === 'landscape' ? LANDSCAPE_DIR : PORTRAIT_DIR;
    const images = scanImages(dir);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(JSON.stringify({ url: imageUrl, type, count: images.length }));
    return;
  }

  // 直接返回图片数据流
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
  console.log(`🚀 Random Pic API running on http://0.0.0.0:${PORT}`);
  scanImages(LANDSCAPE_DIR);
  scanImages(PORTRAIT_DIR);
  console.log('');
  console.log('📡 端点：');
  console.log('   /         — 自适应（自动识别手机/电脑）');
  console.log('   /pc       — 随机横屏壁纸');
  console.log('   /mobile   — 随机竖屏壁纸');
  console.log('   ?type=json — 返回 JSON 格式');
  console.log('');
  console.log('💡 新增图片后只需重启容器即可生效：docker restart random-pic-api');
});
