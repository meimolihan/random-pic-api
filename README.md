# Random Pic API 🖼️

随机壁纸 API — 同时支持 Vercel 和 Docker 部署

根据设备类型自动返回横屏/竖屏壁纸，支持 WebP/JPG/PNG/GIF 格式。

## 🖼️ 在线预览

| 类型 | 地址 | 说明 |
|------|------|------|
| 横屏壁纸 | [https://api.meimolihan.eu.org/pc](https://api.meimolihan.eu.org/pc) | 随机返回一张横屏壁纸 |
| 竖屏壁纸 | [https://api.meimolihan.eu.org/mobile](https://api.meimolihan.eu.org/mobile) | 随机返回一张竖屏壁纸 |
| 自适应 | [https://api.meimolihan.eu.org](https://api.meimolihan.eu.org) | 自动识别设备类型返回对应壁纸 |

> 💡 直接在浏览器打开以上链接即可查看效果，每次刷新随机返回不同图片。

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

## 🚀 部署方式

### 方式一：Vercel 部署（推荐）

#### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)

#### 手动部署

1. Fork 或 clone 本仓库
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 点击 Deploy — 自动完成构建和部署

#### Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### 方式二：Docker 部署

#### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/meimolihan/random-pic-api.git
cd random-pic-api

# 一键启动
docker-compose up -d
```

服务将在 `http://localhost:3000` 启动。

#### 使用 Docker 命令

```bash
# 构建镜像
docker build -t random-pic-api .

# 运行容器
docker run -d \
  --name random-pic-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -v $(pwd)/public/landscape:/app/public/landscape \
  -v $(pwd)/public/portrait:/app/public/portrait \
  random-pic-api
```

#### 自定义壁纸图片

挂载自己的图片目录即可替换壁纸：

```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/your/landscape:/app/public/landscape \
  -v /path/to/your/portrait:/app/public/portrait \
  random-pic-api
```

> 💡 替换图片后需要重启容器以重新生成图片清单：`docker restart random-pic-api`

#### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📁 项目结构

```
├── api/
│   ├── index.js        # 自适应端点（UA 检测）— Vercel Serverless
│   ├── pc.js           # 横屏壁纸端点 — Vercel Serverless
│   ├── mobile.js       # 竖屏壁纸端点 — Vercel Serverless
│   └── _manifest.js    # 构建时自动生成（图片列表）
├── public/
│   ├── landscape/      # 横屏壁纸（418 张）
│   └── portrait/       # 竖屏壁纸（418 张）
├── scripts/
│   └── build.js        # 构建脚本（生成 manifest）
├── docker-server.js    # Docker 部署用的 Node.js HTTP 服务器
├── Dockerfile          # Docker 镜像构建文件
├── docker-compose.yml  # Docker Compose 配置
├── vercel.json         # Vercel 配置
├── package.json
├── classify.py         # 本地图片分类脚本
└── README.md
```

## 🔧 工作原理

### Vercel 部署

1. **构建时**：`scripts/build.js` 扫描图片目录，生成 `api/_manifest.js`
2. **请求时**：Serverless Function 从 manifest 中随机选择一张图片
3. **响应**：返回 302 重定向到 CDN 上的静态图片地址
4. **缓存策略**：重定向不缓存（每次随机），图片缓存 7 天

### Docker 部署

1. **构建时**：Dockerfile 中运行 `npm run build` 生成 manifest
2. **请求时**：Node.js HTTP 服务器从 manifest 中随机选择图片
3. **响应**：直接返回图片数据流（无需 CDN 重定向）
4. **缓存策略**：图片缓存 7 天

## 🖼️ 添加/替换图片

1. 将新图片放入 `public/landscape/`（横屏）或 `public/portrait/`（竖屏）
2. Vercel 部署：推送代码自动触发重新构建
3. Docker 部署：重启容器 `docker restart random-pic-api`

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
