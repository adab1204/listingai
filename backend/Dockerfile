# Use Node LTS
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production deps
RUN npm ci --omit=dev

# Copy rest of code
COPY . .

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "src/server.js"]