# LinkPulse frontend image (development).
# node:22 matches the CI Node version (host runs 23; the container pins 22).
FROM node:22-slim

WORKDIR /app

# Install deps first (cached unless package*.json changes), then copy source.
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 5173

# --host binds Vite to 0.0.0.0 so it's reachable from the host through the
# published port (by default Vite only listens on localhost inside the container).
CMD ["npm", "run", "dev", "--", "--host"]
