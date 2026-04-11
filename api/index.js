const manifest = require('./_manifest');

module.exports = (req, res) => {
  // 检测设备类型
  const ua = req.headers['user-agent'] || '';
  const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
  const type = isMobile ? 'portrait' : 'landscape';
  const images = manifest[type];

  if (!images || images.length === 0) {
    res.status(500).json({ error: `No images found in ${type}` });
    return;
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  const imageUrl = `/${type}/${randomImage}`;

  // 支持 ?type=json 返回 JSON
  if (req.query && req.query.type === 'json') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({
      url: imageUrl,
      type: type,
      count: images.length
    });
    return;
  }

  // 302 重定向到静态图片（Vercel CDN 加速）
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Location', imageUrl);
  res.status(302).end();
};
