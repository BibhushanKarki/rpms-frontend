# Build stage
FROM node:18 AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package files first for caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the project
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy build output to Nginx's web directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Default Nginx command
CMD ["nginx", "-g", "daemon off;"]
