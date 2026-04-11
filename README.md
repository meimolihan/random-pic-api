# Random Pic API 🖼️

随机壁纸 API — Vercel Serverless 部署版

根据设备类型自动返回横屏/竖屏壁纸，支持 WebP/JPG/PNG/GIF 格式。

## 🌐 API 端点

| 端点 | 说明 |
|------|------|
| `/` | 自适应（自动识别手机/电脑） |
| `/pc` | 随机横屏壁纸 |
| `/mobile` | 随机竖屏壁纸 |

### 附加参数

- `?type=json` — 返回 JSON 格式（包含图片 URL、类型、总数）

```bash
# 直接获取随机图片
curl -L https://your-domain.vercel.app/pc

# 获取 JSON 格式
curl https://your-domain.vercel.app/pc?type=json
```

## 🚀 部署到 Vercel

### 方式一：一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)

### 方式二：手动部署

1. Fork 或 clone 本仓库
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 点击 Deploy — 自动完成构建和部署

### 方式三：Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

## 📁 项目结构

```
├── api/
│   ├── index.js        # 自适应端点（UA 检测）
│   ├── pc.js           # 横屏壁纸端点
│   ├── mobile.js       # 竖屏壁纸端点
│   └── _manifest.js    # 构建时自动生成（图片列表）
├── public/
│   ├── landscape/      # 横屏壁纸（418 张）
│   └── portrait/       # 竖屏壁纸（418 张）
├── scripts/
│   └── build.js        # 构建脚本（生成 manifest）
├── vercel.json         # Vercel 配置
├── package.json
├── classify.py         # 本地图片分类脚本
└── README.md
```

## 🔧 工作原理

1. **构建时**：`scripts/build.js` 扫描图片目录，生成 `api/_manifest.js`
2. **请求时**：Serverless Function 从 manifest 中随机选择一张图片
3. **响应**：返回 302 重定向到 CDN 上的静态图片地址
4. **缓存策略**：重定向不缓存（每次随机），图片缓存 7 天

## 🖼️ 添加/替换图片

1. 将新图片放入 `public/landscape/`（横屏）或 `public/portrait/`（竖屏）
2. 重新部署即可（Vercel 会自动运行构建脚本）

或使用本地分类脚本：

```bash
# 将原始图片放入 photos/ 目录
python3 classify.py
```

## 📄 使用示例

### HTML

```html
<img src="https://your-domain.vercel.app/pc" alt="随机壁纸" />
```

### CSS 背景

```css
body {
  background: url('https://your-domain.vercel.app/') no-repeat center/cover;
}
```

### JavaScript

```javascript
// 获取随机壁纸 URL
fetch('https://your-domain.vercel.app/mobile?type=json')
  .then(r => r.json())
  .then(data => console.log(data.url));
```

## 📜 License

MIT
