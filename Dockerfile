FROM node:20-alpine

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Copy build script and public images
COPY scripts/ ./scripts/
COPY public/ ./public/

# Run build to generate manifest
RUN npm run build

# Copy the rest of the application
COPY api/ ./api/
COPY docker-server.js ./

EXPOSE 3000

CMD ["node", "docker-server.js"]
