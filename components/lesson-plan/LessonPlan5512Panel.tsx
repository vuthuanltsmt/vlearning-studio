"use client";

import {
  Eye,
  EyeOff,
  FileDown,
  ImagePlus,
  KeyRound,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type DigitalCompetency = {
  code: string;
  name: string;
  evidence: string;
};

type Activity = {
  title: string;
  objective: string;
  content: string;
  product: string;
  organization: {
    transfer: string;
    perform: string;
    report: string;
    conclude: string;
  };
  digitalCompetencies:
    DigitalCompetency[];
};

type LessonPlan = {
  school: string;
  teacher: string;
  subject: string;
  grade: string;
  lessonTitle: string;
  periods: string;
  objectives: {
    knowledge: string;
    generalCompetencies: string;
    specificCompetencies: string;
    qualities: string;
    digitalCompetencies:
      DigitalCompetency[];
  };
  equipment: string;
  activities: Activity[];
  assessment: string;
  notes: string;
};

type SourceImage = {
  id: string;
  name: string;
  dataUrl: string;
};

const API_KEY_STORAGE =
  "vlearning-openai-api-key-v1";

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `img-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
}

function escapeHtml(
  value: string
) {
  return String(
    value ?? ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraphHtml(
  value: string
) {
  const safe =
    escapeHtml(
      value
    )
      .replace(
        /\r?\n/g,
        "<br/>"
      );

  return safe ||
    "................................................................................................";
}

function competencyHtml(
  items:
    DigitalCompetency[]
) {
  if (
    !Array.isArray(
      items
    ) ||
    items.length ===
      0
  ) {
    return "Không tích hợp riêng trong hoạt động này.";
  }

  return items
    .map(
      (item) =>
        `<b>${escapeHtml(
          item.code
        )} – ${escapeHtml(
          item.name
        )}</b>: ${escapeHtml(
          item.evidence
        )}`
    )
    .join(
      "<br/>"
    );
}

async function compressImage(
  file: File
): Promise<SourceImage> {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      `${file.name} không phải file ảnh.`
    );
  }

  if (
    file.size >
    15 *
      1024 *
      1024
  ) {
    throw new Error(
      `${file.name} vượt quá 15 MB.`
    );
  }

  const inputUrl =
    URL.createObjectURL(
      file
    );

  try {
    const image =
      await new Promise<
        HTMLImageElement
      >(
        (
          resolve,
          reject
        ) => {
          const img =
            new Image();

          img.onload =
            () =>
              resolve(
                img
              );

          img.onerror =
            () =>
              reject(
                new Error(
                  `Không đọc được ảnh ${file.name}.`
                )
              );

          img.src =
            inputUrl;
        }
      );

    const maxSide =
      1800;

    const ratio =
      Math.min(
        1,
        maxSide /
          Math.max(
            image.width,
            image.height
          )
      );

    const width =
      Math.max(
        1,
        Math.round(
          image.width *
          ratio
        )
      );

    const height =
      Math.max(
        1,
        Math.round(
          image.height *
          ratio
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;
    canvas.height =
      height;

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      throw new Error(
        "Không xử lý được ảnh."
      );
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const dataUrl =
      canvas.toDataURL(
        "image/jpeg",
        0.82
      );

    return {
      id:
        createId(),
      name:
        file.name,
      dataUrl,
    };
  } finally {
    URL.revokeObjectURL(
      inputUrl
    );
  }
}

function normalizePlan(
  raw: any
): LessonPlan {
  const activities =
    Array.isArray(
      raw?.activities
    )
      ? raw.activities
      : [];

  return {
    school:
      String(
        raw?.school ??
        ""
      ),
    teacher:
      String(
        raw?.teacher ??
        ""
      ),
    subject:
      String(
        raw?.subject ??
        ""
      ),
    grade:
      String(
        raw?.grade ??
        ""
      ),
    lessonTitle:
      String(
        raw?.lessonTitle ??
        ""
      ),
    periods:
      String(
        raw?.periods ??
        "1"
      ),
    objectives: {
      knowledge:
        String(
          raw?.objectives
            ?.knowledge ??
          ""
        ),
      generalCompetencies:
        String(
          raw?.objectives
            ?.generalCompetencies ??
          ""
        ),
      specificCompetencies:
        String(
          raw?.objectives
            ?.specificCompetencies ??
          ""
        ),
      qualities:
        String(
          raw?.objectives
            ?.qualities ??
          ""
        ),
      digitalCompetencies:
        Array.isArray(
          raw?.objectives
            ?.digitalCompetencies
        )
          ? raw.objectives
              .digitalCompetencies
          : [],
    },
    equipment:
      String(
        raw?.equipment ??
        ""
      ),
    activities:
      activities.map(
        (
          activity: any,
          index: number
        ) => ({
          title:
            String(
              activity?.title ??
              `Hoạt động ${index + 1}`
            ),
          objective:
            String(
              activity?.objective ??
              ""
            ),
          content:
            String(
              activity?.content ??
              ""
            ),
          product:
            String(
              activity?.product ??
              ""
            ),
          organization: {
            transfer:
              String(
                activity
                  ?.organization
                  ?.transfer ??
                ""
              ),
            perform:
              String(
                activity
                  ?.organization
                  ?.perform ??
                ""
              ),
            report:
              String(
                activity
                  ?.organization
                  ?.report ??
                ""
              ),
            conclude:
              String(
                activity
                  ?.organization
                  ?.conclude ??
                ""
              ),
          },
          digitalCompetencies:
            Array.isArray(
              activity
                ?.digitalCompetencies
            )
              ? activity
                  .digitalCompetencies
              : [],
        })
      ),
    assessment:
      String(
        raw?.assessment ??
        ""
      ),
    notes:
      String(
        raw?.notes ??
        ""
      ),
  };
}

export default function LessonPlan5512Panel({
  onOpenMenu,
}: {
  onOpenMenu:
    () => void;
}) {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    images,
    setImages,
  ] =
    useState<
      SourceImage[]
    >([]);

  const [
    plan,
    setPlan,
  ] =
    useState<
      LessonPlan |
      null
    >(null);

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    apiKey,
    setApiKey,
  ] =
    useState("");

  const [
    showApiKey,
    setShowApiKey,
  ] =
    useState(false);

  const [
    keySaved,
    setKeySaved,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          API_KEY_STORAGE
        );

      if (saved) {
        setApiKey(
          saved
        );
        setKeySaved(
          true
        );
      }
    } catch {
      // localStorage may be unavailable.
    }
  }, []);

  function saveApiKey() {
    const value =
      apiKey.trim();

    if (
      !value.startsWith(
        "sk-"
      ) ||
      value.length <
        20
    ) {
      setMessage(
        "API Key chưa hợp lệ. Key OpenAI thường bắt đầu bằng sk-."
      );
      return;
    }

    try {
      localStorage.setItem(
        API_KEY_STORAGE,
        value
      );
      setApiKey(
        value
      );
      setKeySaved(
        true
      );
      setMessage(
        "Đã lưu API Key trên trình duyệt của thiết bị này."
      );
    } catch {
      setMessage(
        "Trình duyệt không cho phép lưu API Key."
      );
    }
  }

  function clearApiKey() {
    try {
      localStorage.removeItem(
        API_KEY_STORAGE
      );
    } catch {
      // Keep UI responsive.
    }

    setApiKey(
      ""
    );
    setKeySaved(
      false
    );
    setShowApiKey(
      false
    );
    setMessage(
      "Đã xóa API Key khỏi trình duyệt."
    );
  }

  async function addFiles(
    files:
      FileList |
      File[]
  ) {
    const list =
      Array.from(
        files
      ).slice(
        0,
        Math.max(
          0,
          10 -
            images.length
        )
      );

    if (
      list.length ===
      0
    ) {
      return;
    }

    setMessage(
      "Đang xử lý ảnh..."
    );

    try {
      const next:
        SourceImage[] =
        [];

      for (
        const file of
        list
      ) {
        next.push(
          await compressImage(
            file
          )
        );
      }

      setImages(
        (current) => [
          ...current,
          ...next,
        ]
      );

      setMessage(
        ""
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không xử lý được ảnh."
      );
    }
  }

  async function generate() {
    if (
      !apiKey.trim()
    ) {
      setMessage(
        "Hãy nhập và lưu API Key OpenAI cá nhân trước."
      );
      return;
    }

    if (
      images.length ===
      0
    ) {
      setMessage(
        "Hãy chọn ít nhất 1 ảnh tài liệu."
      );
      return;
    }

    setBusy(
      true
    );

    setMessage(
      "AI đang đọc tài liệu và soạn giáo án hoàn chỉnh..."
    );

    try {
      const response =
        await fetch(
          "/api/lesson-plan/generate",
          {
            method:
              "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                apiKey:
                  apiKey.trim(),
                images:
                  images.map(
                    (
                      image
                    ) => ({
                      name:
                        image.name,
                      dataUrl:
                        image.dataUrl,
                    })
                  ),
              }),
          }
        );

      const payload =
        await response.json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok ||
        !payload?.ok
      ) {
        throw new Error(
          payload?.error ||
          "Không thể soạn giáo án."
        );
      }

      setPlan(
        normalizePlan(
          payload.plan
        )
      );

      setMessage(
        "Đã soạn xong giáo án. Hãy kiểm tra bản xem trước trước khi xuất Word."
      );
    } catch (
      error
    ) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể soạn giáo án."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  function resetAll() {
    if (
      images.length >
        0 ||
      plan
    ) {
      const confirmed =
        window.confirm(
          "Xóa ảnh tài liệu và giáo án hiện tại?"
        );

      if (!confirmed) {
        return;
      }
    }

    setImages(
      []
    );
    setPlan(
      null
    );
    setMessage(
      ""
    );
  }

  function exportWord() {
    if (!plan) {
      return;
    }

    const activities =
      plan.activities
        .map(
          (
            activity
          ) => `
        <h3>${escapeHtml(
          activity.title
        )}</h3>
        <table>
          <tr>
            <td class="label">a) Mục tiêu</td>
            <td>${paragraphHtml(
              activity.objective
            )}</td>
          </tr>
          <tr>
            <td class="label">b) Nội dung</td>
            <td>${paragraphHtml(
              activity.content
            )}</td>
          </tr>
          <tr>
            <td class="label">c) Sản phẩm</td>
            <td>${paragraphHtml(
              activity.product
            )}</td>
          </tr>
          <tr>
            <td class="label">d) Tổ chức thực hiện</td>
            <td>
              <b>Bước 1. Chuyển giao nhiệm vụ:</b><br/>
              ${paragraphHtml(
                activity.organization
                  .transfer
              )}<br/><br/>
              <b>Bước 2. Thực hiện nhiệm vụ:</b><br/>
              ${paragraphHtml(
                activity.organization
                  .perform
              )}<br/><br/>
              <b>Bước 3. Báo cáo, thảo luận:</b><br/>
              ${paragraphHtml(
                activity.organization
                  .report
              )}<br/><br/>
              <b>Bước 4. Kết luận, nhận định:</b><br/>
              ${paragraphHtml(
                activity.organization
                  .conclude
              )}
            </td>
          </tr>
          <tr>
            <td class="label">Năng lực số tích hợp</td>
            <td>${competencyHtml(
              activity.digitalCompetencies
            )}</td>
          </tr>
        </table>
      `
        )
        .join(
          ""
        );

    const documentHtml =
      `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
@page{size:A4;margin:2cm 2cm 2cm 3cm}
body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.35;color:#000}
.header-table{width:100%;border-collapse:collapse;margin-bottom:8px}
.header-table td{border:0;padding:0;vertical-align:top}
.center{text-align:center}
h1{text-align:center;font-size:16pt;margin:14px 0 6px}
h2{font-size:14pt;margin:14px 0 6px}
h3{font-size:13pt;margin:12px 0 6px}
p{margin:5px 0}
table{width:100%;border-collapse:collapse;margin:6px 0 12px}
td{border:1px solid #000;padding:6px;vertical-align:top}
td.label{width:25%;font-weight:bold}
.meta{text-align:center;margin-bottom:14px}
</style>
</head>
<body>
<table class="header-table">
<tr>
<td>
<b>TRƯỜNG: ${escapeHtml(
        plan.school ||
        "................................"
      )}</b><br/>
Tổ: ................................
</td>
<td class="center">
<b>Họ và tên giáo viên:</b><br/>
${escapeHtml(
        plan.teacher ||
        "................................"
      )}
</td>
</tr>
</table>

<h1>KẾ HOẠCH BÀI DẠY</h1>

<div class="meta">
<b>TÊN BÀI DẠY: ${escapeHtml(
        plan.lessonTitle
      ).toUpperCase()}</b><br/>
Môn học/Hoạt động giáo dục: ${escapeHtml(
        plan.subject
      )}; Lớp: ${escapeHtml(
        plan.grade
      )}<br/>
Thời gian thực hiện: ${escapeHtml(
        plan.periods
      )} tiết
</div>

<h2>I. MỤC TIÊU</h2>
<p><b>1. Về kiến thức</b><br/>${paragraphHtml(
        plan.objectives
          .knowledge
      )}</p>
<p><b>2. Về năng lực</b></p>
<p><b>a) Năng lực chung:</b><br/>${paragraphHtml(
        plan.objectives
          .generalCompetencies
      )}</p>
<p><b>b) Năng lực đặc thù:</b><br/>${paragraphHtml(
        plan.objectives
          .specificCompetencies
      )}</p>
<p><b>3. Về phẩm chất</b><br/>${paragraphHtml(
        plan.objectives
          .qualities
      )}</p>
<p><b>4. Năng lực số tích hợp</b><br/>${competencyHtml(
        plan.objectives
          .digitalCompetencies
      )}</p>

<h2>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
<p>${paragraphHtml(
        plan.equipment
      )}</p>

<h2>III. TIẾN TRÌNH DẠY HỌC</h2>
${activities}

<h2>IV. ĐÁNH GIÁ VÀ HỒ SƠ DẠY HỌC</h2>
<p>${paragraphHtml(
        plan.assessment
      )}</p>

${
        plan.notes
          ? `<h2>V. GHI CHÚ/ĐIỀU CHỈNH SAU BÀI DẠY</h2><p>${paragraphHtml(
              plan.notes
            )}</p>`
          : `<h2>V. GHI CHÚ/ĐIỀU CHỈNH SAU BÀI DẠY</h2><p>................................................................................................</p>`
      }
</body>
</html>`;

    const blob =
      new Blob(
        [
          "\ufeff",
          documentHtml,
        ],
        {
          type:
            "application/msword;charset=utf-8",
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

    const safeTitle =
      (
        plan.lessonTitle ||
        "Giao-an-5512"
      )
        .normalize(
          "NFD"
        )
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-zA-Z0-9-_]+/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );

    anchor.href =
      url;
    anchor.download =
      `${safeTitle || "Giao-an-5512"}-5512.doc`;

    document.body.appendChild(
      anchor
    );
    anchor.click();
    anchor.remove();

    window.setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      1000
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 xl:hidden">
        <button
          type="button"
          onClick={
            onOpenMenu
          }
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300"
        >
          ☰
        </button>

        <div className="text-lg font-black text-cyan-300">
          Giáo án 5512
        </div>
      </div>

      <section className="rounded-[24px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
          AI Lesson Planner
        </div>
        <h1 className="mt-2 text-3xl font-black">
          Giáo án 5512 tự động từ ảnh tài liệu
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Chỉ cần tải ảnh SGK/tài liệu bài học. AI sẽ đọc nội dung, tự xây dựng mục tiêu, tiến trình dạy học, sản phẩm, tổ chức thực hiện và năng lực số; sau đó xuất thành giáo án Word hoàn chỉnh.
        </p>
      </section>

      <section className="mt-5 rounded-[22px] border border-cyan-500/25 bg-[#0c2b50] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
            <KeyRound
              size={20}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-cyan-200">
                1. API Key AI cá nhân
              </h2>

              {keySaved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                  <ShieldCheck
                    size={12}
                  />
                  Đã lưu trên thiết bị
                </span>
              )}
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Mỗi người dùng sử dụng API Key OpenAI của chính mình. Key chỉ được lưu trong trình duyệt này và gửi tới OpenAI khi tạo giáo án; VLearning không lưu key vào cơ sở dữ liệu.
            </p>

            <div className="mt-4 flex flex-col gap-2 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <input
                  type={
                    showApiKey
                      ? "text"
                      : "password"
                  }
                  value={
                    apiKey
                  }
                  onChange={(
                    event
                  ) => {
                    setApiKey(
                      event.target.value
                    );
                    setKeySaved(
                      false
                    );
                  }}
                  placeholder="sk-..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-blue-800 bg-[#071f39] px-3 py-3 pr-11 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowApiKey(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300"
                  title={
                    showApiKey
                      ? "Ẩn API Key"
                      : "Hiện API Key"
                  }
                >
                  {showApiKey ? (
                    <EyeOff
                      size={17}
                    />
                  ) : (
                    <Eye
                      size={17}
                    />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={
                  saveApiKey
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black hover:bg-emerald-500"
              >
                <Save
                  size={15}
                />
                Lưu API Key
              </button>

              <button
                type="button"
                onClick={
                  clearApiKey
                }
                disabled={
                  !apiKey &&
                  !keySaved
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs font-black text-red-300 disabled:opacity-40"
              >
                <Trash2
                  size={15}
                />
                Xóa key
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-5 text-amber-100/80">
              Không chia sẻ API Key cho người khác. ChatGPT Free/Plus/Pro không tự cấp credit API; nếu tài khoản API không có credit, OpenAI sẽ báo hết hạn mức.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-cyan-200">
              2. Đưa ảnh tài liệu vào
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Tối đa 10 ảnh. Nên chụp rõ, đủ trang và theo đúng thứ tự nội dung bài học.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={
                inputRef
              }
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(
                event
              ) => {
                if (
                  event.target.files
                ) {
                  void addFiles(
                    event.target.files
                  );
                }

                event.currentTarget.value =
                  "";
              }}
            />

            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={
                busy ||
                images.length >=
                  10
              }
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200 disabled:opacity-50"
            >
              <ImagePlus
                size={16}
              />
              Chọn ảnh tài liệu
            </button>

            <button
              type="button"
              onClick={
                resetAll
              }
              disabled={
                busy
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-700 bg-[#08233f] px-4 py-2.5 text-xs font-black text-slate-300 disabled:opacity-50"
            >
              <RotateCcw
                size={15}
              />
              Làm mới
            </button>
          </div>
        </div>

        {images.length ===
        0 ? (
          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="mt-4 flex min-h-[210px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-700 bg-[#071f39] px-5 text-center hover:border-cyan-500/50"
          >
            <ImagePlus
              size={42}
              className="text-cyan-300"
            />
            <div className="mt-3 text-sm font-black">
              Bấm để chọn ảnh SGK hoặc tài liệu
            </div>
            <div className="mt-1 text-xs text-slate-500">
              AI sẽ tự đọc nội dung, không cần điền các trường thông tin.
            </div>
          </button>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {images.map(
              (
                image,
                index
              ) => (
                <div
                  key={
                    image.id
                  }
                  className="overflow-hidden rounded-xl border border-blue-800 bg-[#071f39]"
                >
                  <div className="aspect-[4/3] bg-black/30">
                    <img
                      src={
                        image.dataUrl
                      }
                      alt={
                        image.name
                      }
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-bold text-slate-300">
                        {index +
                          1}
                        .{" "}
                        {
                          image.name
                        }
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setImages(
                          (
                            current
                          ) =>
                            current.filter(
                              (
                                item
                              ) =>
                                item.id !==
                                image.id
                            )
                        )
                      }
                      disabled={
                        busy
                      }
                      className="text-red-400 disabled:opacity-40"
                      title="Xóa ảnh"
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={
              generate
            }
            disabled={
              busy ||
              !apiKey.trim() ||
              images.length ===
                0
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-black shadow-lg disabled:opacity-50"
          >
            {busy ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Sparkles
                size={18}
              />
            )}
            {busy
              ? "AI đang soạn giáo án..."
              : "AI SOẠN GIÁO ÁN 5512"}
          </button>

          {message && (
            <div className="text-xs leading-5 text-slate-400">
              {message}
            </div>
          )}
        </div>
      </section>

      {plan && (
        <section className="mt-5 rounded-[22px] border border-emerald-500/30 bg-[#f8fafc] p-5 text-slate-900 shadow-xl sm:p-8">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                Bản xem trước
              </div>
              <h2 className="mt-1 text-2xl font-black">
                Giáo án đã soạn hoàn chỉnh
              </h2>
            </div>

            <button
              type="button"
              onClick={
                exportWord
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-600"
            >
              <FileDown
                size={17}
              />
              Xuất Word hoàn chỉnh
            </button>
          </div>

          <div className="mx-auto max-w-[920px] font-serif text-[15px] leading-7">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <b>TRƯỜNG:</b>{" "}
                {plan.school ||
                  "........................"}
              </div>
              <div className="text-center">
                <b>Họ và tên giáo viên:</b>{" "}
                {plan.teacher ||
                  "........................"}
              </div>
            </div>

            <h1 className="mt-6 text-center text-xl font-black">
              KẾ HOẠCH BÀI DẠY
            </h1>

            <div className="mt-2 text-center">
              <div className="font-black">
                TÊN BÀI DẠY:{" "}
                {plan.lessonTitle}
              </div>
              <div>
                Môn học/HĐGD:{" "}
                {plan.subject} •
                Lớp:{" "}
                {plan.grade}
              </div>
              <div>
                Thời gian thực hiện:{" "}
                {plan.periods} tiết
              </div>
            </div>

            <h2 className="mt-6 font-black">
              I. MỤC TIÊU
            </h2>
            <p>
              <b>1. Về kiến thức:</b><br/>
              {
                plan.objectives
                  .knowledge
              }
            </p>
            <p>
              <b>2. Về năng lực</b><br/>
              <b>a) Năng lực chung:</b>{" "}
              {
                plan.objectives
                  .generalCompetencies
              }<br/>
              <b>b) Năng lực đặc thù:</b>{" "}
              {
                plan.objectives
                  .specificCompetencies
              }
            </p>
            <p>
              <b>3. Về phẩm chất:</b><br/>
              {
                plan.objectives
                  .qualities
              }
            </p>
            <p>
              <b>4. Năng lực số:</b><br/>
              {
                plan.objectives
                  .digitalCompetencies
                  .map(
                    (
                      item
                    ) =>
                      `${item.code} – ${item.name}: ${item.evidence}`
                  )
                  .join(
                    "; "
                  )
              }
            </p>

            <h2 className="mt-6 font-black">
              II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
            </h2>
            <p>
              {plan.equipment}
            </p>

            <h2 className="mt-6 font-black">
              III. TIẾN TRÌNH DẠY HỌC
            </h2>

            {plan.activities.map(
              (
                activity,
                index
              ) => (
                <div
                  key={
                    `${activity.title}-${index}`
                  }
                  className="mt-5"
                >
                  <h3 className="font-black">
                    {activity.title}
                  </h3>
                  <p>
                    <b>a) Mục tiêu:</b>{" "}
                    {activity.objective}
                  </p>
                  <p>
                    <b>b) Nội dung:</b>{" "}
                    {activity.content}
                  </p>
                  <p>
                    <b>c) Sản phẩm:</b>{" "}
                    {activity.product}
                  </p>
                  <div>
                    <b>d) Tổ chức thực hiện:</b>
                    <div className="ml-5">
                      <p><b>Bước 1. Chuyển giao nhiệm vụ:</b> {activity.organization.transfer}</p>
                      <p><b>Bước 2. Thực hiện nhiệm vụ:</b> {activity.organization.perform}</p>
                      <p><b>Bước 3. Báo cáo, thảo luận:</b> {activity.organization.report}</p>
                      <p><b>Bước 4. Kết luận, nhận định:</b> {activity.organization.conclude}</p>
                    </div>
                  </div>

                  {activity.digitalCompetencies.length >
                    0 && (
                    <p>
                      <b>Năng lực số tích hợp:</b>{" "}
                      {
                        activity.digitalCompetencies
                          .map(
                            (
                              item
                            ) =>
                              `${item.code} – ${item.name}: ${item.evidence}`
                          )
                          .join(
                            "; "
                          )
                      }
                    </p>
                  )}
                </div>
              )
            )}

            <h2 className="mt-6 font-black">
              IV. ĐÁNH GIÁ VÀ HỒ SƠ DẠY HỌC
            </h2>
            <p>
              {plan.assessment}
            </p>

            <h2 className="mt-6 font-black">
              V. GHI CHÚ/ĐIỀU CHỈNH SAU BÀI DẠY
            </h2>
            <p>
              {plan.notes ||
                "................................................................................................"}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
