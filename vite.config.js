import { defineConfig } from 'vite';

export default defineConfig({
  // Đảm bảo tất cả đường dẫn asset khi build đều là đường dẫn tương đối
  base: './'
});
