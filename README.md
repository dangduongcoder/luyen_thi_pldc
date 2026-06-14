# Luyện thi Pháp Luật Đại Cương

Một ứng dụng web luyện thi trắc nghiệm Pháp Luật Đại Cương (PLĐC) với giao diện hiện đại, tối giản, được thiết kế tập trung vào trải nghiệm học tập và ôn thi. Ứng dụng tích hợp sẵn các tính năng theo dõi tiến độ, lưu lại lịch sử làm bài và đặc biệt là công cụ hỗ trợ prompt hỏi AI để giải đáp thắc mắc.

## Tính năng chính

- **Chế độ thi đa dạng**: 
  - **Đầy đủ**: 40 câu hỏi, 60 phút.
  - **Luyện nhanh**: 10 câu hỏi, 15 phút.
  - **Làm lại câu sai**: Chỉ ôn lại những câu đã trả lời sai trong các bài thi trước.
  - **Tùy chỉnh**: Tự chọn số lượng câu hỏi và thời gian làm bài mong muốn.
- **Dashboard & Theo dõi tiến độ**: Nằm ngay trang chủ, hiển thị tổng số bài đã làm, điểm trung bình, số câu sai và biểu đồ tiến độ của 5 bài thi gần nhất. Lịch sử chi tiết của từng bài thi được lưu trữ để có thể xem lại bất cứ lúc nào.
- **Giao diện làm bài trực quan**: Hiển thị danh sách câu hỏi, sidebar bên phải dính (sticky) để điều hướng nhanh, xem đồng hồ đếm ngược, theo dõi những câu đã làm/chưa làm và nút nộp bài.
- **Tích hợp AI Prompt (Bóng đèn AI)**: Trong phần xem lại chi tiết kết quả, mỗi câu hỏi đều có biểu tượng bóng đèn. Khi bấm vào, hệ thống sẽ tự động copy một đoạn prompt chuẩn (đã được tối ưu hóa) để bạn dán vào các công cụ AI (ChatGPT/Gemini/Claude). Prompt này sẽ yêu cầu AI phân tích sâu vì sao đáp án đó đúng/sai dựa trên pháp luật Việt Nam và cung cấp mẹo ghi nhớ.
- **Lưu trữ cục bộ**: Mọi lịch sử thi và dữ liệu tiến độ học tập được lưu trữ an toàn trong `localStorage` của trình duyệt. Không cần đăng nhập.
- **API Serverless**: Ứng dụng gọi dữ liệu bộ đề qua API tự động xây dựng trên Vercel Serverless Functions.

## Công nghệ sử dụng

- **Frontend Framework**: SvelteKit / Svelte 5 (sử dụng Runes `$state`, `$effect`).
- **Styling**: Vanilla CSS (Thiết kế Glassmorphism hiện đại, không sử dụng Tailwind).
- **Font chữ**: Be Vietnam Pro.
- **State Management**: Svelte Stores (đồng bộ hóa với `localStorage`).
- **Deployment**: Tương thích hoàn hảo với hệ sinh thái **Vercel** (cung cấp API backend thông qua Serverless Functions).

## Cài đặt và Chạy ở Local

Yêu cầu hệ thống: Node.js (phiên bản 18 trở lên).

1. **Cài đặt các gói phụ thuộc (Dependencies):**

   ```sh
   npm install
   ```

2. **Chạy ứng dụng trong môi trường phát triển (Development):**

   ```sh
   npm run dev
   ```

3. **Truy cập ứng dụng:**
   
   Mở trình duyệt và truy cập vào [http://localhost:5173](http://localhost:5173).

## Build và Deploy lên Vercel

Dự án được cấu trúc để sẵn sàng triển khai trên Vercel. 

```sh
# Build ứng dụng cho môi trường production
npm run build
```

Để đưa ứng dụng lên mạng, bạn chỉ cần liên kết repository GitHub này với một dự án mới trên Vercel. Các API backend trong thư mục `/src/routes/api/` sẽ tự động được biên dịch thành các Serverless Functions.

## Cấu trúc mã nguồn chính

- `src/data/questions.json`: Nơi chứa dữ liệu toàn bộ câu hỏi trắc nghiệm.
- `src/lib/api.ts`: Helper functions để gọi API `/api/questions` lấy đề.
- `src/lib/store.ts`: Quản lý Svelte Stores (`currentExam`, `examHistory`) và xử lý tác vụ đọc/ghi dữ liệu vào `localStorage`.
- `src/routes/+page.svelte`: Trang chủ Dashboard (thống kê, biểu đồ, lịch sử thi) kiêm luôn việc cấu hình và bắt đầu bài thi.
- `src/routes/exam/+page.svelte`: Giao diện lúc đang làm bài trắc nghiệm.
- `src/routes/result/+page.svelte`: Trang hiển thị kết quả tổng quan, xem chi tiết đáp án đúng/sai, và nút hỗ trợ copy prompt AI.
- `src/routes/api/questions/+server.ts`: Endpoint API backend trả về danh sách câu hỏi. Hoạt động trên môi trường Serverless.
