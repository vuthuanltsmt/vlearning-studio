"use client";

import {
  FileDown,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type SourceImage = {
  id: string;
  name: string;
  dataUrl: string;
};

type AssessmentResult = {
  subject: string;
  grade: string;
  testTitle: string;
  duration: number;
  totalScore: number;
  scope: string[];
  matrix: any[];
  matrixTotals: any;
  specification: any[];
  sections: any[];
  answerSummary: string;
  notes: string;
};

const API_KEY_STORAGE =
  "vlearning-openai-api-key-v1";

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return "img-" + Date.now();
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function compressImage(
  file: File
): Promise<SourceImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      file.name +
        " không phải file ảnh."
    );
  }

  const url =
    URL.createObjectURL(file);

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const img =
            new Image();

          img.onload =
            () =>
              resolve(img);

          img.onerror =
            () =>
              reject(
                new Error(
                  "Không đọc được " +
                    file.name
                )
              );

          img.src = url;
        }
      );

    const maxSide = 1800;

    const ratio =
      Math.min(
        1,
        maxSide /
          Math.max(
            image.width,
            image.height
          )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      Math.max(
        1,
        Math.round(
          image.width *
            ratio
        )
      );

    canvas.height =
      Math.max(
        1,
        Math.round(
          image.height *
            ratio
        )
      );

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (!ctx) {
      throw new Error(
        "Không xử lý được ảnh."
      );
    }

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return {
      id: makeId(),
      name: file.name,
      dataUrl:
        canvas.toDataURL(
          "image/jpeg",
          0.82
        ),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cellCount(
  source: any,
  level:
    | "know"
    | "understand"
    | "apply"
) {
  const value =
    source?.[level];

  return typeof value ===
    "number"
    ? value
    : 0;
}

export default function Assessment7991Panel({
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
    apiKey,
    setApiKey,
  ] =
    useState("");

  const [
    images,
    setImages,
  ] =
    useState<
      SourceImage[]
    >([]);

  const [
    duration,
    setDuration,
  ] =
    useState(45);

  const [
    totalScore,
    setTotalScore,
  ] =
    useState(10);

  const [
    result,
    setResult,
  ] =
    useState<
      AssessmentResult |
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

  useEffect(() => {
    try {
      setApiKey(
        localStorage.getItem(
          API_KEY_STORAGE
        ) ?? ""
      );
    } catch {
      // localStorage unavailable.
    }
  }, []);

  async function addFiles(
    files: FileList
  ) {
    const available =
      Math.max(
        0,
        15 -
          images.length
      );

    const list =
      Array.from(
        files
      ).slice(
        0,
        available
      );

    try {
      setMessage(
        "Đang xử lý ảnh..."
      );

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

      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không xử lý được ảnh."
      );
    }
  }

  async function generate() {
    if (!apiKey.trim()) {
      setMessage(
        "Chưa có API Key. Hãy nhập và lưu API Key trong mục Giáo án 5512 trước."
      );
      return;
    }

    if (
      images.length ===
      0
    ) {
      setMessage(
        "Hãy tải ít nhất một ảnh bài học."
      );
      return;
    }

    setBusy(true);
    setMessage(
      "AI đang lập ma trận 7991, bản đặc tả, đề và đáp án..."
    );

    try {
      const response =
        await fetch(
          "/api/assessment/generate",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "same-origin",
            body:
              JSON.stringify({
                apiKey:
                  apiKey.trim(),
                images:
                  images.map(
                    (image) => ({
                      name:
                        image.name,
                      dataUrl:
                        image.dataUrl,
                    })
                  ),
                duration,
                totalScore,
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
            "Không thể tạo đề."
        );
      }

      setResult(
        payload.result as
          AssessmentResult
      );

      setMessage(
        "Đã tạo xong. Hãy kiểm tra Ma trận, Bản đặc tả, Đề và Đáp án trước khi xuất Word."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo đề."
      );
    } finally {
      setBusy(false);
    }
  }

  function resetAll() {
    if (
      images.length ||
      result
    ) {
      if (
        !window.confirm(
          "Xóa tài liệu và kết quả hiện tại?"
        )
      ) {
        return;
      }
    }

    setImages([]);
    setResult(null);
    setMessage("");
  }

  function exportWord() {
    if (!result) {
      return;
    }

    const matrixRows =
      result.matrix
        .map(
          (
            row,
            index
          ) => {
            const types =
              [
                "multipleChoice",
                "trueFalse",
                "shortAnswer",
                "essay",
              ];

            const cells =
              types
                .flatMap(
                  (type) => [
                    cellCount(
                      row[type],
                      "know"
                    ),
                    cellCount(
                      row[type],
                      "understand"
                    ),
                    cellCount(
                      row[type],
                      "apply"
                    ),
                  ]
                )
                .map(
                  (value) =>
                    "<td>" +
                    value +
                    "</td>"
                )
                .join("");

            return (
              "<tr><td>" +
              (index + 1) +
              "</td><td>" +
              escapeHtml(
                row.topic
              ) +
              "</td><td>" +
              escapeHtml(
                row.knowledgeUnit
              ) +
              "</td>" +
              cells +
              "<td>" +
              escapeHtml(
                row.totalScore
              ) +
              "</td><td>" +
              escapeHtml(
                row.percent
              ) +
              "%</td></tr>"
            );
          }
        )
        .join("");

    const specRows =
      result.specification
        .map(
          (
            row,
            index
          ) =>
            "<tr><td>" +
            (index + 1) +
            "</td><td>" +
            escapeHtml(
              row.topic
            ) +
            "</td><td>" +
            escapeHtml(
              row.knowledgeUnit
            ) +
            "</td><td>" +
            escapeHtml(
              row.requirements
                ?.know
            ) +
            "</td><td>" +
            escapeHtml(
              row.requirements
                ?.understand
            ) +
            "</td><td>" +
            escapeHtml(
              row.requirements
                ?.apply
            ) +
            "</td></tr>"
        )
        .join("");

    const questionHtml =
      result.sections
        .map(
          (section) => {
            const questions =
              Array.isArray(
                section.questions
              )
                ? section.questions
                : [];

            return (
              "<h3>" +
              escapeHtml(
                section.title
              ) +
              "</h3>" +
              questions
                .map(
                  (q: any) =>
                    "<p><b>Câu " +
                    escapeHtml(
                      q.number
                    ) +
                    ".</b> " +
                    escapeHtml(
                      q.prompt
                    ) +
                    " <i>(" +
                    escapeHtml(
                      q.score
                    ) +
                    " điểm)</i></p>" +
                    (
                      Array.isArray(
                        q.options
                      )
                        ? q.options
                            .map(
                              (
                                option: string
                              ) =>
                                "<div>" +
                                escapeHtml(
                                  option
                                ) +
                                "</div>"
                            )
                            .join("")
                        : ""
                    )
                )
                .join("")
            );
          }
        )
        .join("");

    const answerHtml =
      result.sections
        .flatMap(
          (section) =>
            Array.isArray(
              section.questions
            )
              ? section.questions
              : []
        )
        .map(
          (q: any) =>
            "<p><b>Câu " +
            escapeHtml(
              q.number
            ) +
            ":</b> " +
            escapeHtml(
              q.answer
            ) +
            (
              q.markingGuide
                ? "<br/>" +
                  escapeHtml(
                    q.markingGuide
                  )
                : ""
            ) +
            "</p>"
        )
        .join("");

    const html =
      '<!doctype html><html><head><meta charset="utf-8"/>' +
      '<style>@page{size:A4;margin:2cm 2cm 2cm 3cm}body{font-family:"Times New Roman";font-size:13pt;color:#000}h1{text-align:center;font-size:16pt}h2{font-size:14pt;margin-top:18px}h3{font-size:13pt}table{width:100%;border-collapse:collapse;font-size:10pt}th,td{border:1px solid #000;padding:4px;text-align:center;vertical-align:middle}.left{text-align:left}</style>' +
      "</head><body>" +
      "<h1>MA TRẬN, BẢN ĐẶC TẢ VÀ ĐỀ KIỂM TRA ĐỊNH KÌ</h1>" +
      "<p><b>Môn:</b> " +
      escapeHtml(
        result.subject
      ) +
      " &nbsp; <b>Lớp:</b> " +
      escapeHtml(
        result.grade
      ) +
      " &nbsp; <b>Thời gian:</b> " +
      escapeHtml(
        result.duration
      ) +
      " phút</p>" +
      "<h2>I. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ – CÔNG VĂN 7991/BGDĐT-GDTrH</h2>" +
      '<table><tr><th rowspan="2">TT</th><th rowspan="2">Chủ đề/Chương</th><th rowspan="2">Nội dung/ĐVKT</th><th colspan="3">Nhiều lựa chọn</th><th colspan="3">Đúng - Sai</th><th colspan="3">Trả lời ngắn</th><th colspan="3">Tự luận</th><th rowspan="2">Điểm</th><th rowspan="2">Tỉ lệ %</th></tr>' +
      "<tr><th>Biết</th><th>Hiểu</th><th>VD</th><th>Biết</th><th>Hiểu</th><th>VD</th><th>Biết</th><th>Hiểu</th><th>VD</th><th>Biết</th><th>Hiểu</th><th>VD</th></tr>" +
      matrixRows +
      "</table>" +
      "<h2>II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ</h2>" +
      '<table><tr><th>TT</th><th>Chủ đề/Chương</th><th>Nội dung/ĐVKT</th><th>Biết</th><th>Hiểu</th><th>Vận dụng</th></tr>' +
      specRows +
      "</table>" +
      "<h2>III. ĐỀ KIỂM TRA</h2>" +
      "<p><b>" +
      escapeHtml(
        result.testTitle
      ) +
      "</b><br/>Thời gian: " +
      escapeHtml(
        result.duration
      ) +
      " phút – Thang điểm: " +
      escapeHtml(
        result.totalScore
      ) +
      "</p>" +
      questionHtml +
      "<h2>IV. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM</h2>" +
      answerHtml +
      "</body></html>";

    const blob =
      new Blob(
        [
          "\ufeff",
          html,
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

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "Ma-tran-De-7991.doc";
    document.body.appendChild(
      link
    );
    link.click();
    link.remove();

    setTimeout(
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
          Ma trận & Đề kiểm tra
        </div>
      </div>

      <section className="rounded-[24px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.15em] text-cyan-300">
          Công văn 7991/BGDĐT-GDTrH
        </div>
        <h1 className="mt-2 text-3xl font-black">
          Ma trận • Bản đặc tả • Đề kiểm tra
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Tải các bài/chủ đề cần kiểm tra. AI sẽ tự phân tích phạm vi kiến thức và tạo đồng bộ ma trận, bản đặc tả, đề kiểm tra, đáp án và hướng dẫn chấm theo Công văn 7991.
        </p>
      </section>

      <section className="mt-5 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
          <div>
            <div className="text-sm font-black text-cyan-200">
              Tài liệu/bài học
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tối đa 15 ảnh. Nên tải đủ các bài nằm trong phạm vi kiểm tra.
            </p>
          </div>

          <label>
            <span className="text-xs font-bold text-slate-400">
              Thời gian
            </span>
            <select
              value={duration}
              onChange={(event) =>
                setDuration(
                  Number(
                    event.target.value
                  )
                )
              }
              className="mt-1.5 w-full rounded-xl border border-blue-800 bg-[#071f39] px-3 py-2.5 text-sm"
            >
              {[15,30,45,60,90,120].map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value} phút
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span className="text-xs font-bold text-slate-400">
              Thang điểm
            </span>
            <input
              type="number"
              min={1}
              max={100}
              value={totalScore}
              onChange={(event) =>
                setTotalScore(
                  Number(
                    event.target.value
                  )
                )
              }
              className="mt-1.5 w-full rounded-xl border border-blue-800 bg-[#071f39] px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => {
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

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            disabled={
              busy ||
              images.length >= 15
            }
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200 disabled:opacity-50"
          >
            <ImagePlus size={16} />
            Chọn ảnh các bài
          </button>

          <button
            type="button"
            onClick={resetAll}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-700 bg-[#08233f] px-4 py-2.5 text-xs font-black text-slate-300"
          >
            <RotateCcw size={15} />
            Làm mới
          </button>
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {images.map(
              (
                image,
                index
              ) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-xl border border-blue-800 bg-[#071f39]"
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="aspect-[4/3] w-full object-contain"
                  />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <div className="truncate text-[10px] text-slate-300">
                      {index + 1}. {image.name}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setImages(
                          (current) =>
                            current.filter(
                              (item) =>
                                item.id !==
                                image.id
                            )
                        )
                      }
                      className="text-red-400"
                    >
                      <Trash2 size={13} />
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
            onClick={generate}
            disabled={
              busy ||
              images.length === 0
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-black disabled:opacity-50"
          >
            {busy ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Sparkles size={18} />
            )}
            {busy
              ? "AI đang tạo..."
              : "AI TẠO MA TRẬN & ĐỀ 7991"}
          </button>

          {message && (
            <div className="text-xs leading-5 text-slate-400">
              {message}
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className="mt-5 rounded-[22px] border border-emerald-500/30 bg-[#f8fafc] p-5 text-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                Kết quả theo Công văn 7991
              </div>
              <h2 className="mt-1 text-2xl font-black">
                {result.testTitle ||
                  "Đề kiểm tra định kì"}
              </h2>
              <div className="mt-1 text-sm text-slate-600">
                {result.subject} • Lớp {result.grade} • {result.duration} phút • {result.totalScore} điểm
              </div>
            </div>

            <button
              type="button"
              onClick={exportWord}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
            >
              <FileDown size={17} />
              Xuất Word hoàn chỉnh
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <h3 className="mb-2 text-lg font-black">
              I. Ma trận đề kiểm tra định kì
            </h3>
            <table className="min-w-[1100px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border p-2">TT</th>
                  <th className="border p-2">Chủ đề/Chương</th>
                  <th className="border p-2">Nội dung/ĐVKT</th>
                  <th className="border p-2">MC-Biết</th>
                  <th className="border p-2">MC-Hiểu</th>
                  <th className="border p-2">MC-VD</th>
                  <th className="border p-2">Đ/S-Biết</th>
                  <th className="border p-2">Đ/S-Hiểu</th>
                  <th className="border p-2">Đ/S-VD</th>
                  <th className="border p-2">TLN-Biết</th>
                  <th className="border p-2">TLN-Hiểu</th>
                  <th className="border p-2">TLN-VD</th>
                  <th className="border p-2">TL-Biết</th>
                  <th className="border p-2">TL-Hiểu</th>
                  <th className="border p-2">TL-VD</th>
                  <th className="border p-2">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {result.matrix.map(
                  (
                    row,
                    index
                  ) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">{row.topic}</td>
                      <td className="border p-2">{row.knowledgeUnit}</td>
                      {[
                        row.multipleChoice,
                        row.trueFalse,
                        row.shortAnswer,
                        row.essay,
                      ].flatMap(
                        (group) => [
                          group?.know ?? 0,
                          group?.understand ?? 0,
                          group?.apply ?? 0,
                        ]
                      ).map(
                        (
                          value,
                          cellIndex
                        ) => (
                          <td
                            key={cellIndex}
                            className="border p-2 text-center"
                          >
                            {value}
                          </td>
                        )
                      )}
                      <td className="border p-2 text-center font-bold">
                        {row.totalScore}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-7 overflow-x-auto">
            <h3 className="mb-2 text-lg font-black">
              II. Bản đặc tả đề kiểm tra định kì
            </h3>
            <table className="min-w-[900px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border p-2">TT</th>
                  <th className="border p-2">Chủ đề/Chương</th>
                  <th className="border p-2">Nội dung/ĐVKT</th>
                  <th className="border p-2">Biết</th>
                  <th className="border p-2">Hiểu</th>
                  <th className="border p-2">Vận dụng</th>
                </tr>
              </thead>
              <tbody>
                {result.specification.map(
                  (
                    row,
                    index
                  ) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">{row.topic}</td>
                      <td className="border p-2">{row.knowledgeUnit}</td>
                      <td className="border p-2">{row.requirements?.know}</td>
                      <td className="border p-2">{row.requirements?.understand}</td>
                      <td className="border p-2">{row.requirements?.apply}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-7">
            <h3 className="text-lg font-black">
              III. Đề kiểm tra
            </h3>

            {result.sections.map(
              (
                section,
                sectionIndex
              ) => (
                <div
                  key={sectionIndex}
                  className="mt-4"
                >
                  <h4 className="font-black">
                    {section.title}
                  </h4>

                  {(section.questions ?? []).map(
                    (
                      question: any,
                      questionIndex: number
                    ) => (
                      <div
                        key={questionIndex}
                        className="mt-3"
                      >
                        <b>
                          Câu {question.number}.
                        </b>{" "}
                        {question.prompt}{" "}
                        <span className="text-sm text-slate-500">
                          ({question.score} điểm)
                        </span>

                        {Array.isArray(
                          question.options
                        ) &&
                          question.options.map(
                            (
                              option: string,
                              optionIndex: number
                            ) => (
                              <div
                                key={optionIndex}
                                className="ml-5"
                              >
                                {option}
                              </div>
                            )
                          )}
                      </div>
                    )
                  )}
                </div>
              )
            )}
          </div>

          <div className="mt-7">
            <h3 className="text-lg font-black">
              IV. Đáp án và hướng dẫn chấm
            </h3>

            {result.sections
              .flatMap(
                (section) =>
                  section.questions ??
                  []
              )
              .map(
                (
                  question: any,
                  index: number
                ) => (
                  <div
                    key={index}
                    className="mt-2"
                  >
                    <b>
                      Câu {question.number}:
                    </b>{" "}
                    {question.answer}
                    {question.markingGuide && (
                      <div className="ml-5 text-sm text-slate-600">
                        {question.markingGuide}
                      </div>
                    )}
                  </div>
                )
              )}
          </div>
        </section>
      )}
    </div>
  );
}
