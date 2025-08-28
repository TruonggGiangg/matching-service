
# Dockerfile for P2P Matching Service
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start"]


# FROM node:20-alpine
# Sử dụng image Node.js phiên bản 20 trên nền Alpine Linux (nhẹ, tối ưu cho production).

# WORKDIR /app
# Đặt thư mục làm việc trong container là /app.

# COPY package*.json ./
# Sao chép các file package.json và package-lock.json (nếu có) vào thư mục làm việc.

# RUN npm install --production
# Cài đặt các package Node.js chỉ cho môi trường production (bỏ qua devDependencies).

# COPY . .
# Sao chép toàn bộ mã nguồn dự án vào container.

# EXPOSE 3001
# Mở cổng 3001 để container có thể nhận kết nối từ bên ngoài (server sẽ chạy trên cổng này).

# CMD ["npm", "run", "start"]
# Khi container khởi động, chạy lệnh npm run start để khởi động ứng dụng Node.js.