# ---- Stage 1: Build React ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json trước để cache tốt hơn
COPY package.json package-lock.json ./
RUN npm ci

# Copy toàn bộ source và build
COPY . .
RUN npm run build
# Kết quả nằm ở /app/dist

# ---- Stage 2: Serve bằng Nginx ----
FROM nginx:alpine

# Copy file build từ stage 1 vào thư mục Nginx serve
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]