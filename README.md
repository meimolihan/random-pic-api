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
# 克隆项目（如果还没有）
git clone https://github.com/meimolihan/random-pic-api.git
cd random-pic-api

# 拉取最新镜像并启动
docker compose pull && docker compose up -d
```

服务将在 `http://localhost:8588` 启动。

> 💡 Docker Hub 镜像：`mobufan/random-pic-api:latest`，包含全部 836 张壁纸，开箱即用。
> 💡 `docker-compose.yml` 已将 `photos/` 目录映射出来，可直接在容器内运行 `python3 classify.py` 批量处理你自己的图片。

#### 使用 Docker Hub 镜像直接运行（无需克隆仓库）

```bash
docker run -d \
  --name random-pic-api \
  --restart always \
  -p 8588:3000 \
  -e TZ=Asia/Shanghai \
  mobufan/random-pic-api:latest
```

#### 自定义壁纸图片

挂载自己的图片目录即可替换内置壁纸：

```bash
docker run -d \
  --name random-pic-api \
  --restart always \
  -p 8588:3000 \
  -e TZ=Asia/Shanghai \
  -v /path/to/your/landscape:/app/public/landscape \
  -v /path/to/your/portrait:/app/public/portrait \
  -v /path/to/your/photos:/app/photos \
  mobufan/random-pic-api:latest
```

> 💡 替换图片后需要重启容器以重新生成图片清单：`docker restart random-pic-api`
> 💡 也可以在容器内运行 `python3 classify.py` 批量处理 `photos/` 目录中的原始图片（需先安装 Pillow）。

#### 🛠️ 本地构建镜像

如果想使用自己的图片集合，可以克隆仓库后本地构建：

**第一步：克隆项目**

```bash
git clone https://github.com/meimolihan/random-pic-api.git
cd random-pic-api
```

**第二步：准备壁纸图片**

将你的图片放入对应目录：

```bash
# 横屏壁纸（放入 public/landscape/）
# 竖屏壁纸（放入 public/portrait/）
# 支持 .webp、.jpg、.jpeg、.png、.gif 格式
```

也可以使用 `classify.py` 脚本自动分类原始图片：

```bash
# 将原始图片放入 photos/ 目录
python3 classify.py
# 脚本会自动识别图片方向并转换格式后放入对应目录
```

**第三步：构建并运行**

```bash
# 构建镜像
docker build -t random-pic-api .

# 运行容器
docker run -d \
  --name random-pic-api \
  --restart always \
  -p 8588:3000 \
  -e TZ=Asia/Shanghai \
  random-pic-api
```

**第四步：验证部署**

```bash
# 查看容器状态
docker ps

# 测试访问
curl -I http://localhost:8588/pc

# 查看日志
docker logs random-pic-api
```

> 💡 **无需 rebuild！** 新增或替换图片后，只需 `docker restart random-pic-api` 即可自动生效。

#### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8588;
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
├── photos/             # 原始图片目录（用于 classify.py 输入）
├── scripts/
│   └── build.js        # 构建脚本（生成 manifest）
├── docker-server.js     # Docker 部署用的 Node.js HTTP 服务器
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

1. **启动时**：Node.js HTTP 服务器动态扫描 `public/` 目录下的所有图片
2. **请求时**：每次请求随机从目录中选取一张图片
3. **响应**：直接返回图片数据流
4. **更新图片**：放入新图片后只需 `docker restart random-pic-api` 即可生效，**无需重新构建镜像**
3. **响应**：直接返回图片数据流（无需 CDN 重定向）
4. **缓存策略**：图片缓存 7 天

## 🖼️ 添加/替换图片

### 方式一：手动放置

直接将图片文件放入对应目录即可：

```bash
# 横屏壁纸
public/landscape/my-photo-1.webp
public/landscape/my-photo-2.jpg

# 竖屏壁纸
public/portrait/my-photo-3.png
public/portrait/my-photo-4.webp
```

放置后重新部署即可生效（Vercel 自动重建，Docker 需重启容器）。

### 方式二：使用 classify.py 自动分类

`classify.py` 可以批量处理原始图片：自动识别横屏/竖屏、转换为 WebP 格式并保存到对应目录。

#### 前提条件

```bash
# 需要 Python 3 和 Pillow 库
pip install Pillow
```

#### 使用步骤

**第一步：放入原始图片**

将需要处理的原始图片（支持 `.jpg/.jpeg/.png/.webp`）放入 `photos/` 目录：

```bash
# 示例目录结构
photos/
├── 风景1.jpg
├── 风景2.png
├── 人像1.jpeg
├── 人像2.webp
└── 合影.jpg
```

**第二步：运行脚本**

```bash
python3 classify.py
```

脚本会自动识别每张图片的方向，转换为 WebP 格式后放入对应目录：

```
========================================
  Random Pic API — 图片分类工具
========================================
  输入目录：/path/to/project/photos
  输出目录：/path/to/project/public/landscape
            /path/to/project/public/portrait
========================================

找到 5 张图片，开始处理...

✅ 处理完成！
   横屏壁纸 → public/landscape/（2 张）
   竖屏壁纸 → public/portrait/（3 张）
```

**第三步：使用处理后的图片**

处理完成的图片会出现在 `public/landscape/`（横屏）和 `public/portrait/`（竖屏）目录中，可以直接用于 API 部署。

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
