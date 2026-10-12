# Hướng dẫn sử dụng VLearning Studio 1.0

## 1. Mở phần mềm

Lần đầu hoặc sau khi thay mã nguồn:
1. Chạy `BUILD-PRODUCTION.cmd`.
2. Khi build báo thành công, chạy `START-VLEARNING.cmd`.
3. Trình duyệt mở `http://localhost:3000/projects`.

Những lần dùng tiếp theo chỉ cần chạy `START-VLEARNING.cmd`, trừ khi bạn sửa mã nguồn.

## 2. Quy trình tạo bài giảng

1. Vào **Projects** và tạo dự án.
2. Mở dự án trong **Editor**.
3. Tạo/đổi tên/sắp xếp các trang.
4. Tải video cho từng trang.
5. Thêm câu hỏi tương tác và đặt thời điểm xuất hiện.
6. Cài điều kiện hoàn thành.
7. Mở **Thiết kế bài giảng** để chỉnh theme, Course Intro, Course Outro và Certificate.
8. Mở **Preview** để học thử toàn bộ bài.
9. Kiểm tra Dashboard, Certificate và Review Mode.
10. Xuất **SCORM 1.2** và thử trên Fake LMS hoặc LMS thật.

## 3. Bảy dạng câu hỏi

- Trắc nghiệm một đáp án.
- Đúng / Sai.
- Nhiều đáp án đúng.
- Trả lời ngắn.
- Ghép đôi.
- Sắp xếp thứ tự.
- Phân loại kéo thả.

## 4. Course Intro

Trang mở đầu có:
- tên bài học;
- mô tả;
- mục tiêu;
- thời lượng;
- số nội dung;
- số câu hỏi;
- ảnh bìa;
- Bắt đầu học / Tiếp tục học.

## 5. Kết quả và Course Outro

Khi hoàn thành:
- xem tổng điểm;
- tỷ lệ Đạt / Chưa đạt;
- số câu đúng/sai/bỏ qua;
- tỷ lệ xem video;
- chi tiết theo từng trang;
- tải CSV;
- in báo cáo;
- mở trang kết thúc;
- xem chứng nhận nếu đạt.

## 6. Review Mode

**Xem lại nội dung** khác với **Học lại**:

- Xem lại nội dung: giữ nguyên điểm/kết quả, mở các trang để xem lại.
- Học lại: reset tiến độ và điểm để bắt đầu lại.

## 7. Chứng nhận

Chỉ xuất hiện khi người học đạt điều kiện.
Có thể tùy chỉnh:
- tiêu đề;
- đơn vị;
- logo;
- chữ ký;
- người ký;
- màu sắc;
- mẫu chứng nhận.

Trong SCORM, hệ thống ưu tiên tên học viên do LMS cung cấp nếu có.

## 8. Sao lưu

Trước khi chỉnh sửa lớn:
- dùng chức năng backup dự án `.vlearning.zip`;
- giữ một bản sao toàn bộ thư mục `elearning-studio`;
- không xóa các file `*-STABLE.txt`.

## 9. Lưu ý quan trọng

Dữ liệu Preview/local app chủ yếu nằm trong trình duyệt (localStorage/IndexedDB).
Không tự ý xóa dữ liệu website của `localhost:3000` nếu chưa backup.
SCORM lưu tiến độ người học thông qua LMS khi chạy trong LMS.
