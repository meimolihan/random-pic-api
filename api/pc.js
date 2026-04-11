const manifest = require('./_manifest');

module.exports = (req, res) => {
  const images = manifest.landscape;

  if (!images || images.length === 0) {
    res.status(500).json({ error: 'No landscape images found' });
    return;
  }

  const randomImage = images[Math.floor(Math.random() * images.length)];
  const imageUrl = `/landscape/${randomImage}`;

  if (req.query && req.query.type === 'json') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({
      url: imageUrl,
      type: 'landscape',
      count: images.length
    });
    return;
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Location', imageUrl);
  res.status(302).end();
};
