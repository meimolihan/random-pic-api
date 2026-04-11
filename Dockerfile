FROM node:20-alpine

WORKDIR /app

# Copy package files and build script
COPY package.json scripts/ ./scripts/
COPY public/ ./public/

# Run build to generate manifest
RUN npm run build

# Copy the rest of the application
COPY api/ ./api/
COPY vercel.json ./

# Install a lightweight HTTP server
RUN npm install --production serve-handler

# Copy custom server
COPY docker-server.js ./

EXPOSE 3000

CMD ["node", "docker-server.js"]
