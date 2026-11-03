import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tắt Cache Components: mọi trang đều đọc SQLite (đồng bộ) mỗi lần request,
  // để tồn kho và công nợ luôn là số mới nhất.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
