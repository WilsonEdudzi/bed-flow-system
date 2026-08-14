# Use Node.js 20 Lightweight Image
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build Next.js (generates the 'out' folder)
COPY . .
RUN npm run build

# Install a lightweight static server globally
RUN npm install -g serve

EXPOSE 3000

# Serve the static export output directory on port 3000
CMD ["serve", "-s", "out", "-l", "3000"]