import Link from "next/link";

export const metadata = {
  title: "Bản quyền | VLearning Studio",
  description:
    "Thông tin tác giả và tuyên bố bản quyền VLearning Studio của Vũ Trọng Thuấn.",
};

export default function CopyrightPage() {
  return (
    <main className="min-h-screen bg-[#06182b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/portal"
          className="text-sm font-black text-cyan-300"
        >
          ← Quay lại VLearning Studio
        </Link>

        <section className="mt-5 rounded-[28px] border border-blue-700/40 bg-gradient-to-br from-[#103b68] via-[#153b6c] to-[#25296c] p-7 shadow-2xl sm:p-10">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
            VLearning Studio • Thông tin bản quyền
          </div>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            Thông tin tác giả và quyền sở hữu
          </h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-black/15 p-5">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Sản phẩm
              </div>
              <div className="mt-2 text-xl font-black">
                VLearning Studio
              </div>
            </div>

            <div className="rounded-2xl bg-black/15 p-5">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Tác giả / Chủ sở hữu
              </div>
              <div className="mt-2 text-xl font-black">
                Vũ Trọng Thuấn
              </div>
            </div>

            <div className="rounded-2xl bg-black/15 p-5">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Điện thoại liên hệ
              </div>
              <a
                href="tel:0972348298"
                className="mt-2 inline-block text-xl font-black text-cyan-300"
              >
                0972348298
              </a>
            </div>

            <div className="rounded-2xl bg-black/15 p-5">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Tuyên bố
              </div>
              <div className="mt-2 text-xl font-black">
                © 2026 Vũ Trọng Thuấn
              </div>
              <div className="mt-1 text-sm text-slate-400">
                All rights reserved.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-7">
          <h2 className="text-xl font-black text-cyan-200">
            Tuyên bố bản quyền
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              VLearning Studio là sản phẩm phần mềm do tác giả Vũ Trọng Thuấn phát triển và công bố dưới tên VLearning Studio.
            </p>

            <p>
              Không sao chép, phân phối, chỉnh sửa, tái phát hành hoặc khai thác thương mại toàn bộ hay một phần mã nguồn, thiết kế, nội dung nhận diện và tài liệu riêng của VLearning Studio khi chưa có sự đồng ý của tác giả/chủ sở hữu, trừ các thành phần bên thứ ba được sử dụng theo giấy phép riêng của chúng.
            </p>

            <p>
              Thông báo bản quyền trên giao diện là thông tin nhận diện tác giả/chủ sở hữu. Việc đăng ký quyền tác giả, nhãn hiệu hoặc các quyền sở hữu trí tuệ khác được thực hiện theo thủ tục pháp luật tương ứng khi cần.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[22px] border border-amber-400/20 bg-amber-400/5 p-6 text-sm leading-7 text-amber-100">
          <strong>Lưu ý về thành phần mã nguồn mở:</strong>{" "}
          VLearning Studio có thể sử dụng các thư viện và nền tảng mã nguồn mở hoặc dịch vụ của bên thứ ba. Quyền và giấy phép đối với các thành phần đó vẫn tuân theo giấy phép riêng của từng nhà cung cấp.
        </section>
      </div>
    </main>
  );
}
