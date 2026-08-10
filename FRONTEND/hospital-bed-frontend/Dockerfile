# Use Node.js 20 Lightweight Image
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build Next.js
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]