"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Download,
  FolderOpen,
  Gamepad2,
  HelpCircle,
  Menu,
  MonitorPlay,
  PlayCircle,
  Search,
  ShieldCheck,
  Upload,
  UserCog,
  Video,
  WandSparkles,
  Wrench,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type GuideTarget =
  | "projects"
  | "games"
  | "script"
  | "ai-settings"
  | "account"
  | "admin-users";

type GuideCategory =
  | "Bắt đầu"
  | "Biên soạn"
  | "Tương tác"
  | "Xuất bản"
  | "Tài khoản"
  | "Xử lý lỗi";

type GuideStep = {
  title: string;
  body: string;
  note?: string;
};

type GuideArticle = {
  id: string;
  title: string;
  short: string;
  category: GuideCategory;
  minutes: number;
  level: "Cơ bản" | "Quan trọng" | "Nâng cao";
  icon:
    | "start"
    | "account"
    | "project"
    | "editor"
    | "quiz"
    | "game"
    | "ai"
    | "preview"
    | "scorm"
    | "backup"
    | "admin"
    | "trouble";
  target?: GuideTarget;
  targetLabel?: string;
  keywords: string[];
  steps: GuideStep[];
  checklist: string[];
  troubleshooting?: string[];
};

const VIEWED_KEY =
  "vlearning-guide-viewed-v1";

const GUIDE_ARTICLES:
  GuideArticle[] =
    [
      {
        id:
          "quick-start",
        title:
          "Bắt đầu nhanh trong 10 phút",
        short:
          "Quy trình ngắn nhất để từ lúc mở VLearning đến khi có một bài giảng Preview chạy được.",
        category:
          "Bắt đầu",
        minutes:
          10,
        level:
          "Cơ bản",
        icon:
          "start",
        target:
          "projects",
        targetLabel:
          "Đi tới Dự án của tôi",
        keywords: [
          "bắt đầu",
          "nhanh",
          "10 phút",
          "project",
          "video",
          "preview",
        ],
        steps: [
          {
            title:
              "Bước 1 – Khởi động VLearning Studio",
            body:
              "Mở thư mục C:\\Users\\Admin\\elearning-studio. Chạy START-VLEARNING.cmd. Giữ cửa sổ server mở. Sau đó mở trình duyệt tại http://localhost:3000/projects và nhấn Ctrl + F5 nếu vừa nâng cấp phiên bản.",
          },
          {
            title:
              "Bước 2 – Đăng nhập đúng quyền",
            body:
              "Nếu đang dùng A16, tài khoản cần quyền ADMIN hoặc TEACHER để biên soạn. Nếu đang ở quyền LEARNER, mục Dự án/Editor sẽ bị ẩn hoặc bị chặn.",
            note:
              "Tài khoản đầu tiên trên database mới tự động là ADMIN."
          },
          {
            title:
              "Bước 3 – Tạo Project",
            body:
              "Vào Dự án của tôi → Tạo mới. Đặt tên rõ ràng, ví dụ: “Tiếng Anh 6 – Unit 2 – My House”. Project mới sẽ xuất hiện trong thư viện.",
          },
          {
            title:
              "Bước 4 – Mở Editor",
            body:
              "Bấm Mở/Chỉnh sửa Project vừa tạo. Editor sẽ tải Project đang hoạt động. Ở đây cô có thể thêm trang, video và câu hỏi tương tác.",
          },
          {
            title:
              "Bước 5 – Tải video cho trang đầu tiên",
            body:
              "Trong Editor, chọn nút tải video. Chờ video tải xong và kiểm tra nút Play. Phát thử vài giây để chắc chắn currentTime và duration được nhận.",
          },
          {
            title:
              "Bước 6 – Thêm một câu hỏi",
            body:
              "Di chuyển video tới mốc mong muốn, chọn Thêm câu hỏi, chọn dạng câu hỏi, nhập nội dung, đáp án và đáp án đúng. Lưu câu hỏi.",
          },
          {
            title:
              "Bước 7 – Mở Preview",
            body:
              "Bấm Xem trước/Preview. Nhấn Play và chờ tới thời điểm câu hỏi. Câu hỏi chỉ nên hiện đúng mốc đã cấu hình, không hiện ngay khi vừa mở Preview.",
          },
          {
            title:
              "Bước 8 – Kiểm tra kết quả",
            body:
              "Trả lời câu hỏi, xem phản hồi Đúng/Sai, kiểm tra điểm và khả năng chuyển trang. Nếu mọi thứ hoạt động, bài giảng cơ bản đã sẵn sàng để tiếp tục hoàn thiện.",
          },
        ],
        checklist: [
          "Server đang chạy.",
          "Đăng nhập bằng ADMIN/TEACHER.",
          "Tạo được Project.",
          "Editor mở đúng Project.",
          "Video phát được.",
          "Câu hỏi xuất hiện đúng thời điểm.",
          "Preview chấm điểm đúng.",
        ],
        troubleshooting: [
          "Không mở được localhost: kiểm tra START-VLEARNING.cmd.",
          "Không thấy Dự án: kiểm tra quyền hệ thống có phải LEARNER không.",
          "Video không phát: thử tải lại trang và kiểm tra file video.",
          "Câu hỏi hiện sai thời điểm: kiểm tra mốc thời gian của câu hỏi.",
        ],
      },
      {
        id:
          "start-stop-server",
        title:
          "Khởi động, dừng và build VLearning",
        short:
          "Hiểu rõ khi nào chỉ cần START, khi nào phải build lại và cách xử lý ERR_CONNECTION_REFUSED.",
        category:
          "Bắt đầu",
        minutes:
          8,
        level:
          "Quan trọng",
        icon:
          "start",
        keywords: [
          "start",
          "build",
          "server",
          "localhost",
          "ERR_CONNECTION_REFUSED",
        ],
        steps: [
          {
            title:
              "Khởi động sử dụng hằng ngày",
            body:
              "Nếu cô không sửa mã nguồn, chỉ cần chạy START-VLEARNING.cmd. Không cần npm install, không cần build lại mỗi lần mở máy.",
          },
          {
            title:
              "Khi nào cần build lại",
            body:
              "Sau khi cài một gói nâng cấp Axx hoặc sửa mã nguồn, nên dừng server, xóa thư mục .next và chạy npm.cmd run build để chắc chắn bản production được cập nhật.",
          },
          {
            title:
              "Lệnh build chuẩn",
            body:
              "Mở PowerShell tại C:\\Users\\Admin\\elearning-studio rồi chạy:\nRemove-Item .\\.next -Recurse -Force -ErrorAction SilentlyContinue\nnpm.cmd run build",
          },
          {
            title:
              "Khởi động production",
            body:
              "Sau khi build thành công, chạy .\\START-VLEARNING.cmd. Mở http://localhost:3000/projects.",
          },
          {
            title:
              "Dừng server",
            body:
              "Đóng cửa sổ server hoặc nhấn Ctrl + C trong cửa sổ đang chạy Next.js. Sau khi server dừng, localhost sẽ không còn truy cập được.",
          },
          {
            title:
              "Ý nghĩa ERR_CONNECTION_REFUSED",
            body:
              "Lỗi này gần như luôn nghĩa là trình duyệt không kết nối được tới server ở cổng 3000. Hãy kiểm tra START-VLEARNING.cmd trước khi nghi ngờ lỗi code.",
          },
        ],
        checklist: [
          "Biết phân biệt lúc cần build và lúc chỉ cần START.",
          "Build không báo lỗi TypeScript.",
          "Trang /projects mở được.",
          "Biết cách dừng server.",
        ],
      },
      {
        id:
          "server-account",
        title:
          "Tạo tài khoản Server và đăng nhập",
        short:
          "Hướng dẫn đầy đủ đăng ký, đăng nhập, ghi nhớ phiên, hồ sơ, đổi mật khẩu và đăng xuất.",
        category:
          "Tài khoản",
        minutes:
          12,
        level:
          "Quan trọng",
        icon:
          "account",
        target:
          "account",
        targetLabel:
          "Mở Đăng nhập / Tài khoản",
        keywords: [
          "tài khoản",
          "đăng ký",
          "đăng nhập",
          "server",
          "sqlite",
          "mật khẩu",
        ],
        steps: [
          {
            title:
              "Mở trang Đăng nhập",
            body:
              "Từ sidebar, bấm Đăng nhập. A16 sử dụng backend Next.js và database SQLite. Tài khoản được xác thực trên server, không còn là mô phỏng Local.",
          },
          {
            title:
              "Chọn Tạo tài khoản",
            body:
              "Nhập Tên hiển thị, Email, Vai trò hồ sơ, Trường/Đơn vị, Mật khẩu và Nhập lại mật khẩu. Email phải đúng định dạng; mật khẩu tối thiểu 8 ký tự, có chữ và số.",
          },
          {
            title:
              "Phân biệt Vai trò hồ sơ và Quyền hệ thống",
            body:
              "Vai trò hồ sơ chỉ mô tả nghề nghiệp như Giáo viên/Cán bộ quản lý. Quyền hệ thống mới quyết định chức năng được phép sử dụng: ADMIN, TEACHER hoặc LEARNER.",
          },
          {
            title:
              "Quy tắc tài khoản đầu tiên",
            body:
              "Nếu database chưa có bất kỳ User nào, tài khoản đầu tiên được tạo sẽ tự động là ADMIN. Các tài khoản tự đăng ký sau đó bắt đầu với quyền LEARNER.",
          },
          {
            title:
              "Đăng nhập",
            body:
              "Nhập Email và Mật khẩu. Nếu bật Ghi nhớ đăng nhập, session sẽ tồn tại lâu hơn. Trình duyệt nhận cookie HttpOnly; token phiên không nằm trong JavaScript client.",
          },
          {
            title:
              "Cập nhật hồ sơ",
            body:
              "Sau đăng nhập, mở Tài khoản. Có thể thay đổi tên hiển thị, vai trò hồ sơ và đơn vị. Email hiện không sửa trực tiếp trong giao diện.",
          },
          {
            title:
              "Đổi mật khẩu",
            body:
              "Trong phần Bảo mật, nhập Mật khẩu hiện tại → Mật khẩu mới → Nhập lại mật khẩu mới. Khi đổi thành công, các session khác của tài khoản bị thu hồi.",
          },
          {
            title:
              "Đăng xuất",
            body:
              "Bấm Đăng xuất ở sidebar hoặc trang Tài khoản. Session hiện tại bị xóa ở server và cookie bị hủy.",
          },
        ],
        checklist: [
          "Tạo tài khoản thành công.",
          "Hiển thị TÀI KHOẢN SERVER.",
          "Hiển thị đúng quyền ADMIN/TEACHER/LEARNER.",
          "Đổi hồ sơ được.",
          "Đổi mật khẩu được.",
          "Đăng xuất và đăng nhập lại được.",
        ],
        troubleshooting: [
          "Nếu database trống, không cần PROMOTE; hãy tạo tài khoản đầu tiên.",
          "Nếu nâng từ A15 mà chưa có Admin, chạy PROMOTE-A16-ADMIN.cmd.",
          "Nếu bị khóa do đăng nhập sai nhiều lần, chờ 15 phút hoặc xử lý trực tiếp bằng Admin.",
        ],
      },
      {
        id:
          "rbac-admin",
        title:
          "Quản trị người dùng và phân quyền A16",
        short:
          "Cách Admin quản lý tài khoản, cấp quyền Giáo viên/Học viên, khóa và xóa tài khoản.",
        category:
          "Tài khoản",
        minutes:
          12,
        level:
          "Nâng cao",
        icon:
          "admin",
        target:
          "admin-users",
        targetLabel:
          "Mở Quản trị người dùng",
        keywords: [
          "rbac",
          "admin",
          "teacher",
          "learner",
          "phân quyền",
        ],
        steps: [
          {
            title:
              "Mở Quản trị người dùng",
            body:
              "Chỉ tài khoản ADMIN nhìn thấy menu Quản trị người dùng. Nếu menu không xuất hiện, mở Tài khoản và kiểm tra mục Quyền hệ thống.",
          },
          {
            title:
              "Đọc bảng thống kê",
            body:
              "Phần đầu cho biết tổng số tài khoản, số Admin, Giáo viên, Học viên và số tài khoản đã vô hiệu.",
          },
          {
            title:
              "Tìm người dùng",
            body:
              "Dùng ô tìm kiếm theo tên, email, đơn vị hoặc vai trò. Bảng danh sách hiển thị từng tài khoản và trạng thái hoạt động.",
          },
          {
            title:
              "Nâng Học viên thành Giáo viên",
            body:
              "Ở cột Vai trò hệ thống, đổi LEARNER → TEACHER. Hệ thống sẽ thu hồi session cũ của tài khoản đó. Người dùng đăng nhập lại sẽ thấy Projects, Editor, Game Builder và AI kịch bản.",
          },
          {
            title:
              "Nâng tài khoản thành Admin",
            body:
              "Đổi accessRole → ADMIN. Sau khi đăng nhập lại, người đó có thêm menu Quản trị người dùng.",
          },
          {
            title:
              "Vô hiệu hóa tài khoản",
            body:
              "Bấm trạng thái ĐANG HOẠT ĐỘNG để chuyển sang ĐÃ VÔ HIỆU. Tài khoản bị vô hiệu không đăng nhập được và session hiện tại bị hủy.",
          },
          {
            title:
              "Xóa tài khoản",
            body:
              "Bấm Xóa tại dòng người dùng. Database sẽ xóa User và các Session liên quan. Project Local trong trình duyệt không tự động bị xóa theo.",
          },
          {
            title:
              "Cơ chế bảo vệ Admin cuối cùng",
            body:
              "A16 không cho phép xóa/hạ quyền/vô hiệu hóa Admin hoạt động cuối cùng. Admin đang đăng nhập cũng không thể tự hạ quyền chính mình từ bảng quản trị.",
          },
        ],
        checklist: [
          "Admin mở được bảng người dùng.",
          "TEACHER không mở được Admin panel.",
          "LEARNER không mở được Editor.",
          "Đổi quyền buộc tài khoản mục tiêu đăng nhập lại.",
          "Không thể xóa Admin cuối cùng.",
        ],
      },
      {
        id:
          "projects-library",
        title:
          "Thư viện Project: tạo, mở, đổi tên, nhân bản, xóa",
        short:
          "Quản lý bài giảng trong Dự án của tôi và hiểu Project đang hoạt động.",
        category:
          "Biên soạn",
        minutes:
          10,
        level:
          "Cơ bản",
        icon:
          "project",
        target:
          "projects",
        targetLabel:
          "Mở Dự án của tôi",
        keywords: [
          "project",
          "dự án",
          "rename",
          "duplicate",
          "delete",
          "thumbnail",
        ],
        steps: [
          {
            title:
              "Tạo Project mới",
            body:
              "Vào Dự án của tôi → Tạo mới. Nhập tên bài giảng. Nên đặt theo cấu trúc Môn – Khối – Bài – Phiên bản để dễ quản lý.",
          },
          {
            title:
              "Mở Project",
            body:
              "Bấm Mở/Chỉnh sửa. VLearning đặt Project đó thành Project đang hoạt động rồi chuyển đến Editor.",
          },
          {
            title:
              "Đổi tên",
            body:
              "Dùng Rename/Đổi tên khi muốn thay tên hiển thị. Việc đổi tên không làm thay đổi ID của Project.",
          },
          {
            title:
              "Nhân bản",
            body:
              "Dùng Duplicate/Nhân bản để tạo phiên bản mới từ bài cũ. Đây là cách an toàn trước khi thử thay đổi lớn.",
          },
          {
            title:
              "Xóa",
            body:
              "Chỉ xóa Project khi chắc chắn đã backup. Xóa Project khỏi Library không đồng nghĩa với xóa một file backup .vlearning.zip đã lưu ngoài máy.",
          },
          {
            title:
              "Thumbnail",
            body:
              "Ảnh đại diện giúp nhận biết bài giảng nhanh trong thư viện. Thumbnail được đưa vào backup A12.",
          },
          {
            title:
              "Tìm kiếm và sắp xếp",
            body:
              "Sử dụng Search/Sort để tìm Project khi thư viện có nhiều bài. Nên thống nhất quy tắc đặt tên ngay từ đầu.",
          },
        ],
        checklist: [
          "Project có tên rõ ràng.",
          "Mở đúng Editor.",
          "Biết dùng Nhân bản trước thay đổi lớn.",
          "Có backup trước khi xóa.",
        ],
      },
      {
        id:
          "editor-pages",
        title:
          "Editor: quản lý trang bài giảng",
        short:
          "Thêm, chọn, đổi tên, nhân bản, xóa trang và tổ chức bài học nhiều phần.",
        category:
          "Biên soạn",
        minutes:
          10,
        level:
          "Cơ bản",
        icon:
          "editor",
        target:
          "projects",
        targetLabel:
          "Mở Project để vào Editor",
        keywords: [
          "editor",
          "page",
          "trang",
          "duplicate page",
          "rename page",
        ],
        steps: [
          {
            title:
              "Hiểu Page",
            body:
              "Mỗi Page là một phần độc lập trong bài giảng. Một Page có thể có video, bộ Quiz và Game được gắn riêng.",
          },
          {
            title:
              "Thêm Page",
            body:
              "Bấm Thêm trang. Đặt tên theo nội dung: Khởi động, Kiến thức 1, Luyện tập, Vận dụng...",
          },
          {
            title:
              "Chọn Page",
            body:
              "Bấm Page trong danh sách để chuyển nội dung đang chỉnh. Video và Quiz hiển thị phải tương ứng Page hiện tại.",
          },
          {
            title:
              "Đổi tên Page",
            body:
              "Dùng Rename khi nội dung thay đổi. Không nên dùng tên Trang 1, Trang 2 nếu bài dài vì rất khó kiểm tra khi xuất SCORM.",
          },
          {
            title:
              "Nhân bản Page",
            body:
              "Duplicate Page phù hợp khi nhiều trang có cấu trúc giống nhau. Sau nhân bản, kiểm tra lại video và Quiz của bản sao.",
          },
          {
            title:
              "Xóa Page",
            body:
              "Xóa trang chỉ khi chắc chắn không còn dùng. Nếu Game đang gắn vào trang đó, nên kiểm tra lại Game Library và liên kết.",
          },
        ],
        checklist: [
          "Mỗi Page có tên theo nội dung.",
          "Chuyển Page đúng nội dung.",
          "Không xóa nhầm Page có dữ liệu.",
          "Kiểm tra liên kết Game sau thay đổi lớn.",
        ],
      },
      {
        id:
          "editor-video",
        title:
          "Editor: tải video, Play/Pause và timeline",
        short:
          "Quản lý video từng trang, kiểm tra thời lượng, tua và thời điểm tương tác.",
        category:
          "Biên soạn",
        minutes:
          10,
        level:
          "Quan trọng",
        icon:
          "editor",
        target:
          "projects",
        targetLabel:
          "Mở Project để chỉnh video",
        keywords: [
          "video",
          "upload",
          "timeline",
          "play",
          "pause",
          "seek",
        ],
        steps: [
          {
            title:
              "Chọn đúng Page trước khi tải video",
            body:
              "Video được lưu theo Page ID. Trước khi Upload, kiểm tra tên trang đang được chọn.",
          },
          {
            title:
              "Upload video",
            body:
              "Chọn file video từ máy. Chờ trình duyệt đọc metadata và hiển thị duration.",
          },
          {
            title:
              "Kiểm tra Play/Pause",
            body:
              "Nhấn Play, Pause và phát lại. Nếu Play không chạy, kiểm tra browser console và thử tải lại Project.",
          },
          {
            title:
              "Kiểm tra tua",
            body:
              "Kéo timeline đến một thời điểm khác. Editor cho phép tua để đặt Quiz; Preview có thể áp dụng logic chống bỏ qua tùy thiết lập.",
          },
          {
            title:
              "Đặt mốc câu hỏi",
            body:
              "Phát/tua video tới giây muốn đặt Quiz rồi thêm câu hỏi. Ghi nhớ: thời điểm Quiz phải nhỏ hơn duration video.",
          },
          {
            title:
              "Dữ liệu video",
            body:
              "Video hiện được lưu bằng IndexedDB trong trình duyệt. Khi chuyển máy, dùng Backup .vlearning.zip để mang media theo.",
          },
        ],
        checklist: [
          "Video đúng Page.",
          "Duration hiển thị.",
          "Play/Pause hoạt động.",
          "Timeline tua được trong Editor.",
          "Quiz không đặt ngoài thời lượng video.",
        ],
      },
      {
        id:
          "quiz-single-true-multiple",
        title:
          "Quiz: Một đáp án, Đúng/Sai, Nhiều đáp án",
        short:
          "Hướng dẫn chi tiết 3 dạng Quiz lựa chọn phổ biến.",
        category:
          "Tương tác",
        minutes:
          12,
        level:
          "Cơ bản",
        icon:
          "quiz",
        target:
          "projects",
        targetLabel:
          "Mở Project để tạo Quiz",
        keywords: [
          "single choice",
          "true false",
          "multiple correct",
          "quiz",
        ],
        steps: [
          {
            title:
              "Một đáp án đúng",
            body:
              "Chọn dạng Single Choice. Nhập câu hỏi, các phương án và chỉ định đúng 1 đáp án chính xác. Dùng dạng này cho câu hỏi trắc nghiệm A/B/C/D.",
          },
          {
            title:
              "Đúng / Sai",
            body:
              "Chọn True/False. Viết phát biểu rõ ràng, tránh câu chứa hai ý dễ gây tranh cãi. Chọn Đúng hoặc Sai làm đáp án.",
          },
          {
            title:
              "Nhiều đáp án đúng",
            body:
              "Chọn Multiple Correct. Đánh dấu tất cả lựa chọn đúng. Khi Preview, người học cần chọn đúng tập hợp đáp án theo logic của hệ thống.",
          },
          {
            title:
              "Đặt thời điểm xuất hiện",
            body:
              "Mỗi Quiz cần mốc thời gian. Không nên đặt ngay giây 0 nếu muốn người học xem nội dung trước.",
          },
          {
            title:
              "Kiểm tra phản hồi",
            body:
              "Preview câu hỏi và thử cả đáp án đúng lẫn sai. Xác nhận thông báo Đúng/Sai và việc cộng điểm.",
          },
        ],
        checklist: [
          "Single Choice chỉ có 1 đáp án đúng.",
          "True/False không mơ hồ.",
          "Multiple Correct đánh dấu đủ đáp án.",
          "Quiz hiện đúng thời điểm.",
        ],
      },
      {
        id:
          "quiz-advanced",
        title:
          "Quiz nâng cao: trả lời ngắn, nối cặp, sắp xếp, phân loại",
        short:
          "Hướng dẫn 4 dạng tương tác nâng cao và cách kiểm tra trong Preview.",
        category:
          "Tương tác",
        minutes:
          15,
        level:
          "Nâng cao",
        icon:
          "quiz",
        target:
          "projects",
        targetLabel:
          "Mở Project để tạo Quiz nâng cao",
        keywords: [
          "short answer",
          "matching",
          "ordering",
          "classification",
          "drag drop",
        ],
        steps: [
          {
            title:
              "Trả lời ngắn",
            body:
              "Dùng khi người học cần nhập một từ/cụm từ. Khi tạo đáp án, lưu ý khoảng trắng, chữ hoa/thường và các biến thể hợp lệ nếu hệ thống cho phép.",
          },
          {
            title:
              "Nối cặp",
            body:
              "Tạo các cặp tương ứng trái – phải. Kiểm tra từng cặp trước khi lưu để tránh dữ liệu bị đảo.",
          },
          {
            title:
              "Sắp xếp",
            body:
              "Nhập các phần tử theo thứ tự đúng chuẩn. Preview sẽ xáo trộn/cho phép sắp lại tùy logic hiện tại. Kiểm tra kết quả bằng cách thử một thứ tự đúng và một thứ tự sai.",
          },
          {
            title:
              "Phân loại kéo-thả",
            body:
              "Tạo các nhóm đích và các item thuộc từng nhóm. Tên nhóm phải rõ; mỗi item phải có đúng nhóm chuẩn.",
          },
          {
            title:
              "Kiểm tra trên Preview",
            body:
              "Các dạng nâng cao cần kiểm tra trực tiếp bằng chuột. Đặc biệt chú ý kéo-thả, trạng thái đã chọn và khả năng làm lại.",
          },
        ],
        checklist: [
          "Dữ liệu cặp/nhóm không bị nhầm.",
          "Thứ tự chuẩn chính xác.",
          "Kéo-thả hoạt động.",
          "Chấm đúng/sai chính xác.",
        ],
      },
      {
        id:
          "completion-settings",
        title:
          "Điều kiện hoàn thành và điểm đạt",
        short:
          "Thiết lập passScore, tỷ lệ xem video và yêu cầu hoàn thành Quiz.",
        category:
          "Xuất bản",
        minutes:
          9,
        level:
          "Quan trọng",
        icon:
          "preview",
        target:
          "projects",
        targetLabel:
          "Mở Project để kiểm tra Completion",
        keywords: [
          "pass score",
          "watch percent",
          "completion",
          "đạt",
          "chưa đạt",
        ],
        steps: [
          {
            title:
              "Điểm đạt passScorePercent",
            body:
              "Đặt ngưỡng % điểm Quiz tối thiểu. Ví dụ 70 nghĩa là người học cần đạt ít nhất 70% điểm Quiz chính.",
          },
          {
            title:
              "Tỷ lệ xem minWatchPercent",
            body:
              "Đặt tỷ lệ video tối thiểu cần xem. Preview dùng dữ liệu watch progress để xác định mức độ xem.",
          },
          {
            title:
              "Yêu cầu hoàn thành tất cả Quiz",
            body:
              "Bật requireAllQuizzes nếu bài học yêu cầu người học phải tương tác với toàn bộ câu hỏi thay vì chỉ đạt điểm.",
          },
          {
            title:
              "Game không thay điểm Quiz",
            body:
              "Game Builder là hoạt động luyện tập bổ trợ. Điểm Game không cộng vào passScore và không đổi Passed/Failed của SCORM.",
          },
          {
            title:
              "Test cả trường hợp đạt và không đạt",
            body:
              "Trong Preview, làm một lượt cố ý sai để kiểm tra Chưa đạt, sau đó làm lượt đạt để kiểm tra Đạt.",
          },
        ],
        checklist: [
          "Ngưỡng điểm phù hợp.",
          "Watch percent phù hợp.",
          "requireAllQuizzes đúng yêu cầu.",
          "Đạt/Chưa đạt hoạt động chính xác.",
        ],
      },
      {
        id:
          "game-builder",
        title:
          "Game Builder: tạo, lưu, chơi thử và gắn vào Page",
        short:
          "Quy trình đầy đủ từ thư viện Game đến Editor, Preview và SCORM.",
        category:
          "Tương tác",
        minutes:
          12,
        level:
          "Quan trọng",
        icon:
          "game",
        target:
          "games",
        targetLabel:
          "Mở Game Builder",
        keywords: [
          "game",
          "builder",
          "gắn game",
          "project",
          "page",
        ],
        steps: [
          {
            title:
              "Tạo Game mới",
            body:
              "Vào Trò chơi → Tạo trò chơi mới. Nhập tên và mô tả. Game hiện dùng bộ câu hỏi 4 lựa chọn A/B/C/D.",
          },
          {
            title:
              "Tạo câu hỏi",
            body:
              "Nhập nội dung, 4 đáp án và chọn radio tại đáp án đúng. Thêm các câu tiếp theo bằng Thêm câu hỏi.",
          },
          {
            title:
              "Lưu Game",
            body:
              "Bấm Lưu. Game được lưu trong thư viện trình duyệt với key vlearning-game-library-v1.",
          },
          {
            title:
              "Chơi thử",
            body:
              "Bấm Chơi thử. Trả lời các câu, xem phản hồi và kết quả %. Nếu sai logic, quay lại chỉnh sửa trước khi gắn.",
          },
          {
            title:
              "Chọn Project và Page",
            body:
              "Trong Gắn vào bài giảng, chọn Project → Page. Nếu danh sách Project trống, mở/đồng bộ Project rồi bấm Làm mới dự án.",
          },
          {
            title:
              "Gắn Game",
            body:
              "Bấm Gắn vào trang đã chọn. Liên kết được lưu theo Game ID + Project ID + Page ID.",
          },
          {
            title:
              "Kiểm tra Editor",
            body:
              "Mở Project. Trang có Game sẽ hiển thị thanh Trò chơi của trang và nút Chơi thử.",
          },
          {
            title:
              "Kiểm tra Preview",
            body:
              "Ở đúng Page, nút Trò chơi xuất hiện trên vùng video. Có thể mở Game, chơi và xem kết quả.",
          },
          {
            title:
              "Kiểm tra SCORM",
            body:
              "A11 nhúng linked Games vào course data khi export. Upload SCORM lên Fake LMS và kiểm tra nút Game vẫn xuất hiện.",
          },
        ],
        checklist: [
          "Game đã lưu.",
          "Đáp án đúng chính xác.",
          "Chơi thử đạt.",
          "Gắn đúng Project/Page.",
          "Editor thấy Game.",
          "Preview thấy Game.",
          "SCORM thấy Game.",
        ],
      },
      {
        id:
          "ai-script",
        title:
          "AI Kịch bản: tạo một kịch bản e-learning hoàn chỉnh",
        short:
          "Hướng dẫn cách nhập dữ liệu để bộ sinh kịch bản A13 tạo nội dung 15 phần hữu ích.",
        category:
          "Biên soạn",
        minutes:
          15,
        level:
          "Nâng cao",
        icon:
          "ai",
        target:
          "script",
        targetLabel:
          "Mở AI Kịch bản",
        keywords: [
          "ai script",
          "kịch bản",
          "15 phần",
          "lời dẫn",
          "phân cảnh",
        ],
        steps: [
          {
            title:
              "Đặt tên kịch bản và chủ đề",
            body:
              "Tên kịch bản dùng để lưu trong thư viện. Chủ đề/Bài học là trường quan trọng nhất vì được dùng xuyên suốt nội dung sinh ra.",
          },
          {
            title:
              "Nhập Môn/Lĩnh vực – Khối/Lớp – Đối tượng",
            body:
              "Ví dụ: Môn Tiếng Anh, Lớp 6, Học sinh THCS. Nếu là mầm non, ghi rõ độ tuổi như Trẻ 4–5 tuổi.",
          },
          {
            title:
              "Chọn thời lượng và loại bài",
            body:
              "Thời lượng được dùng để phân bổ phút cho Khởi động, Kiến thức, Luyện tập, Vận dụng và Đánh giá.",
          },
          {
            title:
              "Viết 4 nhóm mục tiêu",
            body:
              "Điền Kiến thức, Kĩ năng, Năng lực, Phẩm chất. Nên dùng động từ đo được như nêu, nhận biết, giải thích, thực hiện, vận dụng.",
          },
          {
            title:
              "Nhập kiến thức nền và nội dung trọng tâm",
            body:
              "Liệt kê mỗi ý trọng tâm một dòng. Tránh chỉ nhập tên bài vì kết quả sẽ chung chung.",
          },
          {
            title:
              "Phương pháp – Media – Đánh giá",
            body:
              "Khai báo phương pháp dạy học, hình/video/sơ đồ cần dùng và trọng tâm muốn kiểm tra.",
          },
          {
            title:
              "Phong cách lời dẫn và mức tương tác",
            body:
              "Chọn lời dẫn thân thiện, trang trọng hoặc phù hợp lứa tuổi. Mức tương tác càng cao thì kịch bản càng gợi ý nhiều điểm dừng/câu hỏi.",
          },
          {
            title:
              "Tạo kịch bản chi tiết",
            body:
              "Bấm Tạo kịch bản chi tiết. Hệ thống tạo 15 phần: thông tin, mục tiêu, kiến thức nền, trọng tâm, phương pháp, media, nguyên tắc e-learning, tiến trình, bảng cảnh, câu hỏi, phản hồi, video, tương tác, SCORM và checklist.",
          },
          {
            title:
              "Hiệu chỉnh",
            body:
              "Không nên dùng nguyên văn mà không kiểm tra. Giáo viên cần đối chiếu SGK, chuẩn kiến thức và mục tiêu thực tế của bài.",
          },
          {
            title:
              "Lưu / Sao chép / Tải TXT",
            body:
              "Lưu để mở lại trong thư viện. Có thể Sao chép hoặc Tải TXT để dùng trong Word, PowerPoint hoặc quy trình sản xuất video.",
            note:
              "A13 hiện là bộ sinh Local theo cấu trúc, chưa gọi ChatGPT/API trực tuyến."
          },
        ],
        checklist: [
          "Chủ đề cụ thể.",
          "Mục tiêu đủ 4 nhóm.",
          "Nội dung trọng tâm rõ.",
          "Phân cảnh phù hợp thời lượng.",
          "Đã hiệu chỉnh theo tài liệu chính thức.",
          "Đã lưu kịch bản.",
        ],
      },
      {
        id:
          "preview",
        title:
          "Preview: kiểm tra bài như người học",
        short:
          "Checklist chạy thử video, Quiz, Game, khóa trang, Resume, Dashboard và Certificate.",
        category:
          "Xuất bản",
        minutes:
          15,
        level:
          "Quan trọng",
        icon:
          "preview",
        target:
          "projects",
        targetLabel:
          "Mở Project rồi vào Preview",
        keywords: [
          "preview",
          "resume",
          "dashboard",
          "certificate",
          "anti skip",
        ],
        steps: [
          {
            title:
              "Bắt đầu từ Page đầu tiên",
            body:
              "Mở Preview và chạy như một học viên thật. Không chỉ nhảy thẳng tới Page cuối.",
          },
          {
            title:
              "Kiểm tra video",
            body:
              "Play/Pause, tua, thời lượng và watch progress. Nếu anti-skip bật, thử tua trước để kiểm tra hệ thống không ghi nhận sai phần chưa xem.",
          },
          {
            title:
              "Kiểm tra Quiz",
            body:
              "Đợi đúng mốc câu hỏi, trả lời đúng/sai và xác nhận feedback. Kiểm tra tất cả dạng Quiz đang dùng.",
          },
          {
            title:
              "Kiểm tra Game",
            body:
              "Nếu Page có Game, bấm nút Trò chơi. Chơi hết và xác nhận điểm Game không làm thay đổi điểm Quiz chính.",
          },
          {
            title:
              "Kiểm tra chuyển Page",
            body:
              "Nếu Page sau bị khóa, xác nhận điều kiện mở khóa đúng. Thử một lượt chưa đạt và một lượt đạt.",
          },
          {
            title:
              "Kiểm tra Resume",
            body:
              "Thoát Preview giữa chừng, mở lại và kiểm tra Page/thời điểm phát được khôi phục.",
          },
          {
            title:
              "Kiểm tra Dashboard/Report",
            body:
              "Sau khi hoàn thành, xem Dashboard, CSV/Print report và trạng thái kết quả.",
          },
          {
            title:
              "Kiểm tra Certificate",
            body:
              "Nếu bật chứng nhận, kiểm tra tên học viên, template và điều kiện xuất hiện.",
          },
        ],
        checklist: [
          "Video và watch progress đúng.",
          "Quiz đúng thời điểm.",
          "Game hoạt động.",
          "Page lock đúng.",
          "Resume đúng.",
          "Dashboard/Report đúng.",
          "Certificate đúng.",
        ],
      },
      {
        id:
          "scorm",
        title:
          "Xuất SCORM 1.2 và kiểm thử trên Fake LMS",
        short:
          "Quy trình chuẩn trước khi upload lên Moodle/LMS thật.",
        category:
          "Xuất bản",
        minutes:
          15,
        level:
          "Nâng cao",
        icon:
          "scorm",
        target:
          "projects",
        targetLabel:
          "Mở Project để xuất SCORM",
        keywords: [
          "scorm",
          "1.2",
          "lms",
          "fake lms",
          "lesson_status",
          "suspend_data",
        ],
        steps: [
          {
            title:
              "Chỉ export sau khi Preview đạt",
            body:
              "Preview phải chạy hoàn chỉnh trước. SCORM sẽ đóng gói trạng thái, nội dung, video và Quiz hiện tại của Project.",
          },
          {
            title:
              "Bấm Export SCORM 1.2",
            body:
              "Chờ VLearning tạo file ZIP. Không sửa cấu trúc trong ZIP sau khi xuất.",
          },
          {
            title:
              "Hiểu dữ liệu LMS chính",
            body:
              "VLearning dùng SCORM 1.2 với cmi.core.score.raw, lesson_status, lesson_location, suspend_data và exit để hỗ trợ điểm, trạng thái và Resume.",
          },
          {
            title:
              "Test Fake LMS",
            body:
              "Mở http://localhost:3000/scorm-lms-test/index.html. Nạp gói SCORM và Launch.",
          },
          {
            title:
              "Kiểm tra điểm",
            body:
              "Làm Quiz và xem score trên Fake LMS. Điểm Game không được tính vào score chính.",
          },
          {
            title:
              "Kiểm tra Passed/Failed",
            body:
              "Thử trường hợp không đạt và đạt. lesson_status phải phản ánh đúng điều kiện completion.",
          },
          {
            title:
              "Kiểm tra Resume",
            body:
              "Dừng giữa bài, đóng course rồi launch lại. lesson_location/suspend_data phải giúp khôi phục tiến độ.",
          },
          {
            title:
              "Kiểm tra Intro/Outro/Review",
            body:
              "Nếu Project dùng Course Intro, Outro hoặc Review Mode, chạy thử đầy đủ.",
          },
          {
            title:
              "Upload LMS thật",
            body:
              "Khi Fake LMS ổn, upload nguyên ZIP lên LMS thật. Sau đó chạy một lượt test bằng tài khoản học viên thật của LMS.",
          },
        ],
        checklist: [
          "ZIP SCORM tạo thành công.",
          "Launch được.",
          "Score đúng.",
          "Passed/Failed đúng.",
          "Resume đúng.",
          "Game hoạt động.",
          "Certificate/Report đúng nếu dùng.",
        ],
        troubleshooting: [
          "LMS không mở: kiểm tra imsmanifest.xml và ZIP nguyên vẹn.",
          "Score sai: kiểm tra Quiz chính và passScore.",
          "Resume sai: kiểm tra lesson_location và suspend_data trên Fake LMS.",
        ],
      },
      {
        id:
          "backup",
        title:
          "Backup / Restore và chuyển bài sang máy khác",
        short:
          "Sao lưu đầy đủ Project, video, Game và khôi phục an toàn.",
        category:
          "Xuất bản",
        minutes:
          12,
        level:
          "Quan trọng",
        icon:
          "backup",
        target:
          "projects",
        targetLabel:
          "Mở Dự án của tôi",
        keywords: [
          "backup",
          "restore",
          "chuyển máy",
          "vlearning.zip",
          "media",
        ],
        steps: [
          {
            title:
              "Tạo backup",
            body:
              "Trong Dự án của tôi, chọn Backup/Sao lưu cho Project cần giữ. Hệ thống tạo file .vlearning.zip.",
          },
          {
            title:
              "Backup A12 chứa gì",
            body:
              "Project JSON, completion settings, thumbnail, video/media, Game đã liên kết và game-links của Project.",
          },
          {
            title:
              "Lưu file backup ngoài thư mục project",
            body:
              "Nên chép .vlearning.zip sang USB, ổ D hoặc cloud cá nhân. Không để bản backup duy nhất trong cùng thư mục mã nguồn.",
          },
          {
            title:
              "Import trên máy khác",
            body:
              "Cài VLearning trên máy mới, mở /projects, chọn Import backup và chọn file .vlearning.zip.",
          },
          {
            title:
              "Remap ID",
            body:
              "A12 tạo ID mới cho Project/Page/Game khi import để tránh đè dữ liệu hiện có.",
          },
          {
            title:
              "Kiểm tra sau Restore",
            body:
              "Mở từng Page, kiểm tra video, Quiz, linked Game, Preview và Completion.",
          },
          {
            title:
              "Xuất SCORM lại",
            body:
              "Nếu Project được chỉnh sửa sau restore, export SCORM mới để đảm bảo nội dung đồng bộ.",
          },
        ],
        checklist: [
          "Có file .vlearning.zip.",
          "Backup lưu ngoài thư mục code.",
          "Import thành công.",
          "Video đủ.",
          "Quiz đủ.",
          "Game liên kết đúng.",
        ],
      },
      {
        id:
          "portable",
        title:
          "Mang VLearning sang máy tính khác",
        short:
          "Phân biệt mã nguồn ứng dụng và dữ liệu Project khi chuyển máy.",
        category:
          "Bắt đầu",
        minutes:
          10,
        level:
          "Nâng cao",
        icon:
          "backup",
        keywords: [
          "portable",
          "máy khác",
          "node",
          "source",
          "node_modules",
        ],
        steps: [
          {
            title:
              "Sao chép mã nguồn hiện tại",
            body:
              "Nguồn tốt nhất là thư mục C:\\Users\\Admin\\elearning-studio hiện đang chạy ổn định.",
          },
          {
            title:
              "Không cần mang .next và node_modules nếu muốn gói nhẹ",
            body:
              "Có thể xóa node_modules và .next trước khi nén. Máy mới cần cài Node.js rồi chạy npm.cmd install và npm.cmd run build.",
          },
          {
            title:
              "Mang database nếu cần tài khoản A16",
            body:
              "Nếu muốn giữ tài khoản server hiện tại, cần sao lưu file prisma\\vlearning.db cùng source. Nếu không mang file này, database mới sẽ không có User cũ.",
          },
          {
            title:
              "Mang Project bằng backup",
            body:
              "Project/video không nên chỉ trông chờ vào việc copy source vì nhiều dữ liệu nằm trong browser storage/IndexedDB. Dùng .vlearning.zip cho từng Project.",
          },
          {
            title:
              "Cài dependencies trên máy mới",
            body:
              "Trong thư mục project chạy npm.cmd install. Nếu dùng A16, chạy SETUP-A16-RBAC.cmd để generate Prisma Client và cập nhật database.",
          },
          {
            title:
              "Build và test",
            body:
              "Chạy npm.cmd run build → START-VLEARNING.cmd → mở /projects → import Project backup → Preview.",
          },
        ],
        checklist: [
          "Có source VLearning.",
          "Có backup Project.",
          "Có database nếu cần giữ account.",
          "Máy mới có Node.js.",
          "Build thành công.",
        ],
      },
      {
        id:
          "troubleshooting",
        title:
          "Xử lý lỗi thường gặp – từng tình huống",
        short:
          "Bảng chẩn đoán nhanh cho server, build, Prisma, quyền, Project, Game và SCORM.",
        category:
          "Xử lý lỗi",
        minutes:
          20,
        level:
          "Quan trọng",
        icon:
          "trouble",
        keywords: [
          "lỗi",
          "server",
          "build",
          "prisma",
          "game",
          "project",
          "scorm",
        ],
        steps: [
          {
            title:
              "Lỗi 1 – ERR_CONNECTION_REFUSED",
            body:
              "Kiểm tra START-VLEARNING.cmd. Nếu server chưa chạy, khởi động lại. Không sửa code khi lỗi chỉ do server tắt.",
          },
          {
            title:
              "Lỗi 2 – Giao diện vẫn là phiên bản cũ",
            body:
              "Nhấn Ctrl + F5. Nếu chưa được: dừng server → xóa .next → npm.cmd run build → START-VLEARNING.cmd.",
          },
          {
            title:
              "Lỗi 3 – Build thất bại",
            body:
              "Đọc lỗi đầu tiên. Ghi đúng file và số dòng. Sửa một lỗi tại một thời điểm. Không thay nhiều file cùng lúc.",
          },
          {
            title:
              "Lỗi 4 – Prisma Client chưa generate",
            body:
              "Chạy SETUP-A16-RBAC.cmd hoặc npx.cmd prisma generate. Sau thay schema cần prisma db push.",
          },
          {
            title:
              "Lỗi 5 – Không có Admin",
            body:
              "Nếu database mới: tạo tài khoản đầu tiên. Nếu database A15 cũ: chạy PROMOTE-A16-ADMIN.cmd và đăng nhập lại.",
          },
          {
            title:
              "Lỗi 6 – Không thấy Projects/Editor",
            body:
              "Mở Tài khoản và xem Quyền hệ thống. LEARNER không có quyền authoring. Admin nâng tài khoản lên TEACHER.",
          },
          {
            title:
              "Lỗi 7 – Game không thấy Project",
            body:
              "Mở Project trong Dự án của tôi trước, quay lại Game Builder và bấm Làm mới dự án.",
          },
          {
            title:
              "Lỗi 8 – Preview không thấy Game",
            body:
              "Kiểm tra Game đã gắn đúng Project ID và Page ID. Mở đúng Page trong Preview.",
          },
          {
            title:
              "Lỗi 9 – SCORM không có Game",
            body:
              "Đảm bảo đang dùng exporter A11+, Game đã gắn trước khi export và gói SCORM vừa được tạo lại.",
          },
          {
            title:
              "Lỗi 10 – Chuyển máy mất video",
            body:
              "Video nằm trong IndexedDB. Hãy import từ backup .vlearning.zip thay vì chỉ copy thư mục source.",
          },
        ],
        checklist: [
          "Xác định lỗi thuộc Server, Build, Database, Quyền hay Dữ liệu.",
          "Không xóa database khi chưa backup.",
          "Không xóa Project khi chưa có .vlearning.zip.",
          "Chụp dòng lỗi đầu tiên nếu cần hỗ trợ.",
        ],
        troubleshooting: [
          "Ưu tiên kiểm tra đường dẫn và server trước.",
          "Khi build lỗi, dùng đúng C:\\Users\\Admin\\elearning-studio.",
          "Khi Prisma lỗi, chạy lại script setup của đúng phiên bản.",
        ],
      },
    ];

function iconFor(
  name: GuideArticle["icon"]
) {
  switch (
    name
  ) {
    case "start":
      return PlayCircle;
    case "account":
      return UserCog;
    case "project":
      return FolderOpen;
    case "editor":
      return Video;
    case "quiz":
      return HelpCircle;
    case "game":
      return Gamepad2;
    case "ai":
      return WandSparkles;
    case "preview":
      return MonitorPlay;
    case "scorm":
      return Upload;
    case "backup":
      return Download;
    case "admin":
      return ShieldCheck;
    default:
      return Wrench;
  }
}

function articleText(
  article: GuideArticle
) {
  const steps =
    article.steps
      .map(
        (
          step,
          index
        ) =>
          `${index + 1}. ${step.title}\n${step.body}${
            step.note
              ? `\nLưu ý: ${step.note}`
              : ""
          }`
      )
      .join(
        "\n\n"
      );

  const checklist =
    article.checklist
      .map(
        (item) =>
          `[ ] ${item}`
      )
      .join(
        "\n"
      );

  const troubleshooting =
    article.troubleshooting?.length
      ? `\n\nXỬ LÝ LỖI / LƯU Ý\n${article.troubleshooting
          .map(
            (item) =>
              `- ${item}`
          )
          .join(
            "\n"
          )}`
      : "";

  return `${article.title}

${article.short}

CÁC BƯỚC
${steps}

CHECKLIST
${checklist}${troubleshooting}`;
}

export default function GuideCenter({
  onNavigate,
  onOpenMenu,
}: {
  onNavigate: (
    section: GuideTarget
  ) => void;
  onOpenMenu: () => void;
}) {
  const [
    activeId,
    setActiveId,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState<
      "Tất cả" | GuideCategory
    >("Tất cả");

  const [
    viewed,
    setViewed,
  ] =
    useState<string[]>(
      []
    );

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          VIEWED_KEY
        );

      if (
        raw
      ) {
        const parsed =
          JSON.parse(
            raw
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          setViewed(
            parsed.filter(
              (item) =>
                typeof item ===
                "string"
            )
          );
        }
      }
    } catch {
      // Guide remains usable without localStorage.
    }
  }, []);

  const filtered =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLocaleLowerCase(
              "vi"
            );

        return GUIDE_ARTICLES.filter(
          (article) => {
            const categoryMatch =
              category ===
                "Tất cả" ||
              article.category ===
                category;

            if (
              !categoryMatch
            ) {
              return false;
            }

            if (
              !keyword
            ) {
              return true;
            }

            return [
              article.title,
              article.short,
              article.category,
              ...article.keywords,
            ]
              .join(
                " "
              )
              .toLocaleLowerCase(
                "vi"
              )
              .includes(
                keyword
              );
          }
        );
      },
      [
        search,
        category,
      ]
    );

  const active =
    activeId
      ? GUIDE_ARTICLES.find(
          (article) =>
            article.id ===
            activeId
        ) ??
        null
      : null;

  function openArticle(
    article: GuideArticle
  ) {
    setActiveId(
      article.id
    );
    setCopied(
      false
    );

    setViewed(
      (current) => {
        const next =
          current.includes(
            article.id
          )
            ? current
            : [
                ...current,
                article.id,
              ];

        try {
          localStorage.setItem(
            VIEWED_KEY,
            JSON.stringify(
              next
            )
          );
        } catch {
          // Reading progress is optional.
        }

        return next;
      }
    );

    window.scrollTo({
      top:
        0,
      behavior:
        "smooth",
    });
  }

  async function copyArticle(
    article: GuideArticle
  ) {
    try {
      await navigator.clipboard.writeText(
        articleText(
          article
        )
      );

      setCopied(
        true
      );
    } catch {
      window.alert(
        "Không thể sao chép tự động."
      );
    }
  }

  function downloadArticle(
    article: GuideArticle
  ) {
    const blob =
      new Blob(
        [
          articleText(
            article
          ),
        ],
        {
          type:
            "text/plain;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      `VLearning-Huong-dan-${article.id}.txt`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  if (
    active
  ) {
    const ActiveIcon =
      iconFor(
        active.icon
      );

    return (
      <div>
        <div className="mb-5 flex items-center gap-3 xl:hidden">
          <button
            type="button"
            onClick={
              onOpenMenu
            }
            aria-label="Mở menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300"
          >
            <Menu
              size={20}
            />
          </button>

          <div>
            <div className="text-lg font-black text-cyan-300">
              HƯỚNG DẪN
            </div>
            <div className="text-[10px] text-slate-500">
              VLearning Studio
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setActiveId(
              null
            )
          }
          className="inline-flex items-center gap-2 rounded-xl border border-blue-800 bg-[#0c2b50] px-4 py-2.5 text-xs font-black text-cyan-200 hover:bg-[#11365f]"
        >
          <ArrowLeft
            size={15}
          />
          Quay lại Trung tâm hướng dẫn
        </button>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-blue-700/40 bg-[#0c2b50]">
          <div className="bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                  <ActiveIcon
                    size={27}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black text-cyan-200">
                      {active.category}
                    </span>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-slate-300">
                      {active.level}
                    </span>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-slate-300">
                      ~{active.minutes} phút
                    </span>
                  </div>

                  <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                    {active.title}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                    {active.short}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void copyArticle(
                      active
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200"
                >
                  <ClipboardCopy
                    size={15}
                  />
                  {copied
                    ? "Đã sao chép ✓"
                    : "Sao chép"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadArticle(
                      active
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-black text-blue-200"
                >
                  <Download
                    size={15}
                  />
                  Tải TXT
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[1fr_330px]">
            <main>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                Hướng dẫn từng bước
              </div>

              <div className="mt-5 space-y-4">
                {active.steps.map(
                  (
                    step,
                    index
                  ) => (
                    <article
                      key={`${active.id}-${index}`}
                      className="rounded-2xl border border-blue-800/70 bg-[#08233f] p-5"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-black text-cyan-300">
                          {index +
                            1}
                        </div>

                        <div className="min-w-0">
                          <h2 className="text-base font-black text-slate-100">
                            {step.title}
                          </h2>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                            {step.body}
                          </p>

                          {step.note && (
                            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">
                              <b>
                                Lưu ý:
                              </b>{" "}
                              {step.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </main>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-300">
                  <CheckCircle2
                    size={16}
                  />
                  Checklist
                </div>

                <div className="mt-4 space-y-3">
                  {active.checklist.map(
                    (item) => (
                      <div
                        key={
                          item
                        }
                        className="flex gap-2 text-xs leading-5 text-slate-300"
                      >
                        <span className="mt-0.5 text-emerald-400">
                          □
                        </span>
                        <span>
                          {item}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>

              {active.troubleshooting &&
                active.troubleshooting.length >
                  0 && (
                <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-300">
                    <Wrench
                      size={16}
                    />
                    Xử lý lỗi
                  </div>

                  <div className="mt-4 space-y-3">
                    {active.troubleshooting.map(
                      (item) => (
                        <div
                          key={
                            item
                          }
                          className="text-xs leading-6 text-slate-400"
                        >
                          • {item}
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

              {active.target &&
                active.targetLabel && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(
                      active.target as GuideTarget
                    )
                  }
                  className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-4 text-left text-sm font-black shadow-lg"
                >
                  <span>
                    {
                      active.targetLabel
                    }
                  </span>
                  <ChevronRight
                    size={18}
                  />
                </button>
              )}
            </aside>
          </div>
        </section>
      </div>
    );
  }

  const categories:
    Array<
      "Tất cả" | GuideCategory
    > =
      [
        "Tất cả",
        "Bắt đầu",
        "Biên soạn",
        "Tương tác",
        "Xuất bản",
        "Tài khoản",
        "Xử lý lỗi",
      ];

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 xl:hidden">
        <button
          type="button"
          onClick={
            onOpenMenu
          }
          aria-label="Mở menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300"
        >
          <Menu
            size={20}
          />
        </button>

        <div>
          <div className="text-lg font-black text-cyan-300">
            HƯỚNG DẪN
          </div>
          <div className="text-[10px] text-slate-500">
            VLearning Studio
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] px-7 py-9 shadow-[0_22px_70px_rgba(0,0,0,0.22)] lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-300">
              <BookOpen
                size={25}
              />
              <span className="text-xs font-black uppercase tracking-[0.16em]">
                Trung tâm trợ giúp
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Hướng dẫn sử dụng chi tiết
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Đây là sổ tay sử dụng đầy đủ của VLearning Studio. Mỗi bài có hướng dẫn từng bước, tên chức năng cần bấm, checklist kiểm tra và cách xử lý lỗi. Hãy chọn một chủ đề rồi bấm “MỞ HƯỚNG DẪN CHI TIẾT”.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4">
            <div className="text-2xl font-black text-cyan-200">
              {viewed.length}/
              {
                GUIDE_ARTICLES.length
              }
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-cyan-300/70">
              chủ đề đã đọc
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[520px]">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Tìm: SCORM, đăng nhập, Game, Editor, backup..."
              className="w-full rounded-xl border border-blue-800 bg-[#071d35] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(
              (item) => (
                <button
                  key={
                    item
                  }
                  type="button"
                  onClick={() =>
                    setCategory(
                      item
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-[11px] font-black transition ${
                    category ===
                    item
                      ? "bg-cyan-500 text-[#06233d]"
                      : "bg-[#08233f] text-slate-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {filtered.length ===
      0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-blue-800 bg-[#0c2b50] p-12 text-center text-sm text-slate-500">
          Không tìm thấy hướng dẫn phù hợp.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map(
            (article) => {
              const Icon =
                iconFor(
                  article.icon
                );

              const isViewed =
                viewed.includes(
                  article.id
                );

              return (
                <article
                  key={
                    article.id
                  }
                  className="group flex min-h-[270px] flex-col rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6 transition hover:-translate-y-0.5 hover:border-cyan-500/45"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                      <Icon
                        size={21}
                      />
                    </div>

                    {isViewed && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-300">
                        ĐÃ MỞ
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      • {article.minutes} phút
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-black leading-snug">
                    {article.title}
                  </h2>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                    {article.short}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      openArticle(
                        article
                      )
                    }
                    className="mt-5 flex w-full items-center justify-between rounded-xl bg-[#08233f] px-4 py-3 text-xs font-black text-cyan-200 transition group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>
                      MỞ HƯỚNG DẪN CHI TIẾT
                    </span>
                    <ChevronRight
                      size={15}
                    />
                  </button>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
