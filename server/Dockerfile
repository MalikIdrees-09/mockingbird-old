FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Set production env
ENV NODE_ENV=production
# Cloud Run sets PORT env
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]



