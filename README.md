# Badminton Scoreboard

Ứng dụng web tính điểm cầu lông đôi, tối ưu cho thiết bị di động. Giao diện mô
phỏng sân cầu lông: hai đội nằm hai bên lưới, chạm vào nửa sân của một đội để
cộng điểm. Ứng dụng luôn hiển thị đội đang giao cầu và người giao cầu tiếp theo
theo luật giao cầu đôi.

## Tính năng

- Bố cục sân trái/phải với lưới ở giữa, mỗi đội có hai ô người chơi.
- Chạm nền sân để cộng điểm; chạm ô tên để sửa tên (không cộng điểm).
- Ở tỉ số 0:0, lần chạm đầu tiên để **chọn đội giao cầu** (không cộng điểm).
- Hiển thị đội đang giao cầu bằng màu nổi bật và đánh dấu người giao cầu tiếp theo.
- Tự động xoay vị trí hai người khi đội giao cầu thắng rally; giữ nguyên vị trí khi
  đội đỡ giành quyền giao.
- Nút **Đổi sân** hoán đổi hai đội và điểm số nhưng giữ nguyên người giao cầu.
- Nút **Đổi vị trí** hoán đổi hai người trong cùng một đội (hiệu chỉnh ban đầu).
- **Hoàn tác** không giới hạn cho mọi thao tác: cộng điểm, chọn giao, đổi sân,
  đổi vị trí, sửa tên.

Luật: không giới hạn điểm, không tự động xác định thắng thua — người dùng quyết định.

## Stack

- [Vite](https://vitejs.dev/) + TypeScript (vanilla, không framework UI)
- Engine thuần túy tách khỏi DOM, kiểm thử bằng [Vitest](https://vitest.dev/)

## Phát triển

```bash
npm install
npm run dev        # dev server
npm test           # chạy unit test
npm run typecheck  # kiểm tra kiểu
npm run build      # build tĩnh ra dist/
npm run preview    # xem thử bản build
```

## Triển khai lên Cloudflare Pages

Ứng dụng là trang tĩnh hoàn toàn, không cần backend hay biến môi trường.

### Deploy bằng Wrangler CLI

```bash
npx wrangler login    # đăng nhập Cloudflare (một lần)
npm run deploy        # build rồi deploy lên Pages
```

Lần chạy đầu tiên, Wrangler sẽ hỏi tạo project Pages mới; sau đó cấu hình đã có
sẵn trong `wrangler.toml` (`name`, `pages_build_output_dir = "dist"`).

### Deploy qua Git integration

1. Kết nối repository với Cloudflare Pages.
2. Cấu hình build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Node version: 20 trở lên (khuyến nghị 22).

## Kiến trúc

- `src/engine.ts` — state bất biến của trận đấu, các lệnh (`tapTeam`, `swapPlayers`,
  `changeSides`, `renamePlayer`, `undo`, ...) và các phép suy dẫn (`serverCourt`,
  `servePlayer`, `visibleSlot`). Không phụ thuộc DOM.
- `src/main.ts` — dựng giao diện và xử lý tương tác (event delegation).
- `src/types.ts` — các kiểu dữ liệu dùng chung.
- `src/engine.test.ts` — unit test cho toàn bộ luật tính điểm và giao cầu.

Vị trí người chơi được lưu theo **ô giao cầu tương đối** (`left`/`right`) so với
hướng của đội, không phải vị trí trên màn hình. Nhờ vậy thao tác Đổi sân (quay
180°) giữ nguyên danh tính người giao cầu.
