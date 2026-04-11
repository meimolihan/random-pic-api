FROM node:20-alpine

WORKDIR /app

# 复制应用代码和全部壁纸图片
COPY public/ ./public/
COPY api/ ./api/
COPY docker-server.js ./
COPY package.json ./

EXPOSE 3000

CMD ["node", "docker-server.js"]
