# Use Node.js 20 Alpine as base image
FROM node:20-alpine  

# Set working 
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create public/assets directory for file uploads
RUN mkdir -p public/assets

# Start the application
CMD ["npm", "start"]
