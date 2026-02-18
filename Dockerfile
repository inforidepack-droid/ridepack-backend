# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm i

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy .env file
COPY .env .env

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
