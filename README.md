# Lâm Thế Vinh — Tốt nghiệp

Website chúc mừng tốt nghiệp dùng React, Vite và Firebase Cloud Firestore. Ảnh sticker được đặt giữa trang; các dòng chữ pixel chạy độc lập phía sau, và lời chúc gửi lên Firestore sẽ được đồng bộ theo thời gian thực.

## Cấu trúc dự án

```text
public/vinhsticker.png              Ảnh tốt nghiệp
src/components/PixelMarquee.jsx     Các dòng chữ chạy
src/components/WishForm.jsx         Form gửi lời chúc
src/components/GraduationSticker.jsx Loại nền đen của ảnh sticker
src/firebase.js                     Cấu hình và API Firestore
src/App.jsx, App.css, index.css     Giao diện chính và kiểu dáng
firestore.rules                     Quy tắc bảo mật Firestore
firebase.json                       Cấu hình Firestore Emulator
tests/firestore.rules.test.js       Kiểm thử rules
.github/workflows/deploy.yml        Tự động build và deploy GitHub Pages
```

## Chạy local

Yêu cầu Node.js 22 trở lên và npm. Cài dependencies, sao chép file môi trường mẫu thành `.env.local`, điền cấu hình Firebase (hướng dẫn ở phần kế tiếp), sau đó chạy:

```sh
npm install
# Windows PowerShell:
Copy-Item .env.example .env.local
# macOS/Linux:
cp .env.example .env.local
npm run dev
```

Vite hiển thị URL local, thường là `http://localhost:5173`. `npm run build` tạo bản production trong `dist/`; `npm run preview` xem thử bản build. `npm run lint` chạy Oxlint.

## Tạo Firebase project và cấu hình Firestore

1. Tạo project tại [Firebase Console](https://console.firebase.google.com/).
2. Trong Project settings → General, đăng ký một Web App và lấy Firebase configuration.
3. Tạo Firestore Database (Production mode) tại khu vực phù hợp.
4. Vào Firestore → Rules, dán nội dung `firestore.rules` trong repository và bấm Publish.
5. Điền các giá trị Web App vào `.env.local` theo các tên `VITE_FIREBASE_*` trong `.env.example`. Không commit `.env.local`.
6. Chạy lại `npm run dev` sau khi thay đổi biến môi trường. `VITE_*` được nhúng vào bundle khi build; các giá trị này có thể được người truy cập nhìn thấy. Firebase Web API key không phải bí mật hay cơ chế phân quyền. Không đặt service-account key, private key hoặc thông tin xác thực máy chủ trong frontend.

Ứng dụng dùng collection `wishes` với các trường `name`, `message`, `createdAt`; lời chúc mới và tên người gửi được tạo cùng transaction. Collection `wishNames` giữ chỗ tên đã dùng, nên tên trùng chính xác (sau khi bỏ khoảng trắng ở đầu/cuối) không thể gửi lần nữa. Tên phân biệt chữ hoa/chữ thường. Khi gặp tên đã có từ trước lúc bật tính năng này, ứng dụng sẽ giữ chỗ tên cũ và từ chối lần gửi trùng đó. Lắng nghe `onSnapshot()` để đồng bộ mọi lời chúc và dùng `serverTimestamp()` khi tạo document. Nếu chưa có cấu hình Firebase, trang vẫn hiển thị nhưng form báo cần cấu hình.

## Kiểm thử Firestore Security Rules bằng Emulator

Bộ kiểm thử dùng `@firebase/rules-unit-testing` và Firestore Emulator. Mở hai terminal ở thư mục repository:

Terminal 1 — khởi chạy Emulator:

```sh
npx firebase-tools emulators:start --only firestore --project demo-vin-grad
```

Terminal 2 — chạy test rules:

```sh
npm run test:rules
```

Test xác nhận public read và create hợp lệ theo transaction được phép; tên trùng, tên/câu chúc quá dài, trường thừa, timestamp do client tự đặt, update và delete bị từ chối. Emulator UI có tại `http://127.0.0.1:4000`.

Có thể thử giao diện gửi vào Emulator thay vì database production: giữ Emulator đang chạy, đặt `VITE_USE_FIREBASE_EMULATOR=true` trong `.env.local`, rồi chạy `npm run dev`. Kết nối Emulator chỉ được kích hoạt trong chế độ development. Bỏ cấu hình này hoặc đặt `false` để chạy với Firebase thật.

## Kiểm tra đồng bộ trên hai thiết bị

1. Deploy bản build có cấu hình Firebase và Security Rules đã publish.
2. Mở trang đó đồng thời trên hai trình duyệt hoặc thiết bị khác nhau.
3. Gửi lời chúc từ thiết bị thứ nhất. Sau khi được lưu, lời chúc phải hiện trên dòng marquee ở cả hai thiết bị mà không tải lại trang.
4. Kiểm tra Firestore Console → Data → `wishes` để xác nhận có document với timestamp máy chủ. Tải lại trang thứ hai để kiểm tra dữ liệu vẫn còn.
5. Khi kiểm tra lỗi, xem Console/Network của trình duyệt và Firestore Rules/Usage trong Firebase Console.

## GitHub Pages deployment

Workflow `.github/workflows/deploy.yml` chạy khi có push lên `main` (hoặc thủ công qua Actions), cài dependencies, build rồi deploy GitHub Pages. Vite tự suy ra `base` từ tên repository trong `GITHUB_REPOSITORY`, vì vậy ảnh `public/vinhsticker.png` hoạt động cả ở URL subpath của project repository.

1. Tạo repository GitHub; repository có thể tên `vin-grad` hoặc tên khác.
2. Push mã nguồn lên nhánh `main`.
3. Vào repository Settings → Secrets and variables → Actions → New repository secret, tạo các secret sau và chép giá trị Web App Firebase tương ứng vào:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Vào Settings → Pages, chọn **GitHub Actions** làm Build and deployment source.
5. Push commit để chạy workflow. Theo dõi Actions; URL được hiển thị trong job deploy và Settings → Pages.
6. Mở URL công khai, gửi một lời chúc và kiểm tra cả document trong Firestore lẫn cập nhật realtime trên trình duyệt thứ hai.

Dùng GitHub Secrets giúp cấu hình build mà không commit `.env.local`, nhưng không khiến Firebase Web config trở thành bí mật: nó có trong JavaScript tải về trình duyệt. Quyền truy cập được bảo vệ bởi Firestore Security Rules.

## Bảo mật và chống spam trước khi công khai

- Rules chỉ cho phép đọc và tạo đúng ba trường; tên và lời chúc phải là chuỗi không rỗng với giới hạn tương ứng 16/80 ký tự; `createdAt` phải bằng thời gian request của máy chủ. Mọi cập nhật và xóa bị từ chối.
- Giới hạn ở form/frontend chỉ giúp trải nghiệm tốt hơn, **không** bảo vệ database. Rules là hàng rào bắt buộc phía máy chủ, nhưng một endpoint public cho phép tạo document hợp lệ vẫn có thể bị spam.
- Trước khi quảng bá rộng, bật Firebase App Check cho Web bằng reCAPTCHA Enterprise (đăng ký app, cấu hình provider và enforce cho Cloud Firestore sau khi xác minh metrics). Có thể bổ sung rate limiting phía máy chủ qua callable Cloud Function/API, kiểm duyệt hoặc cơ chế xác thực nếu cần; không thể làm rate limit đáng tin cậy chỉ bằng code trình duyệt.
- Không cấp quyền `update`/`delete` cho khách truy cập ẩn danh và không đưa service account credentials lên GitHub.

## Checklist sau deploy

- [ ] Trang tải thành công ở URL GitHub Pages có subpath.
- [ ] Ảnh sticker hiển thị đúng tỷ lệ; marquee chạy phía sau ảnh và tôn trọng `prefers-reduced-motion`.
- [ ] Form hoạt động ở desktop và mobile; kiểm tra dữ liệu trống, giới hạn ký tự, trạng thái đang gửi và thông báo lỗi/thành công.
- [ ] Lời chúc mới xuất hiện realtime trên ít nhất hai trình duyệt.
- [ ] Firestore lưu `name`, `message`, `createdAt`; Rules từ chối dữ liệu sai, update và delete.
- [ ] `.env.local` không được commit; GitHub Actions Secrets đã được khai báo.
- [ ] App Check và biện pháp hạn chế spam đã được cân nhắc/bật trước khi công khai rộng.
