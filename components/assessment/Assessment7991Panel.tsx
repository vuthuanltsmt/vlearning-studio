"use client";

import {
  Clipboard,
  ExternalLink,
  FileDown,
  FileText,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type SourceItem = {
  id: string;
  name: string;
  kind: "image" | "file";
  mime: string;
  dataUrl: string;
};

type TestVersion = {
  code: string;
  sections: any[];
  answerSummary?: string;
  notes?: string;
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
  versions: TestVersion[];
  notes?: string;
};

type ResultTab =
  | "matrix"
  | "spec"
  | "code01"
  | "answer01"
  | "code02"
  | "answer02";

const API_KEY_STORAGE =
  "vlearning-openai-api-key-v1";

const MAX_SOURCES = 12;

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return (
      "source-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }
}

function escapeHtml(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    );
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

function readAsDataUrl(
  file: File
) {
  return new Promise<string>(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result ===
            "string"
          ) {
            resolve(
              reader.result
            );
          } else {
            reject(
              new Error(
                "Không đọc được " +
                  file.name
              )
            );
          }
        };

      reader.onerror =
        () =>
          reject(
            new Error(
              "Không đọc được " +
                file.name
            )
          );

      reader.readAsDataURL(
        file
      );
    }
  );
}

async function compressImage(
  file: File
): Promise<SourceItem> {
  const url =
    URL.createObjectURL(
      file
    );

  try {
    const image =
      await new Promise<HTMLImageElement>(
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
                  "Không đọc được " +
                    file.name
                )
              );

          img.src =
            url;
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
      canvas.width,
      canvas.height
    );

    return {
      id:
        makeId(),
      name:
        file.name,
      kind:
        "image",
      mime:
        "image/jpeg",
      dataUrl:
        canvas.toDataURL(
          "image/jpeg",
          0.82
        ),
    };
  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

async function prepareSource(
  file: File
): Promise<SourceItem> {
  if (
    file.type.startsWith(
      "image/"
    )
  ) {
    return compressImage(
      file
    );
  }

  const extension =
    file.name
      .toLowerCase()
      .split(".")
      .pop();

  let mime =
    file.type;

  if (
    extension === "pdf"
  ) {
    mime =
      "application/pdf";
  } else if (
    extension === "docx"
  ) {
    mime =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (
    extension === "txt"
  ) {
    mime =
      "text/plain";
  } else {
    throw new Error(
      file.name +
        " chưa được hỗ trợ. Hãy dùng ảnh, PDF, DOCX hoặc TXT."
    );
  }

  if (
    file.size >
    6 * 1024 * 1024
  ) {
    throw new Error(
      file.name +
        " lớn hơn 6 MB. Hãy giảm dung lượng tài liệu."
    );
  }

  return {
    id:
      makeId(),
    name:
      file.name,
    kind:
      "file",
    mime,
    dataUrl:
      await readAsDataUrl(
        file
      ),
  };
}

function parseJsonText(
  value: string
) {
  let cleaned =
    value.trim();

  const fence =
    String.fromCharCode(
      96,
      96,
      96
    );

  if (
    cleaned.startsWith(
      fence
    )
  ) {
    const firstBreak =
      cleaned.indexOf(
        "\n"
      );

    if (
      firstBreak >= 0
    ) {
      cleaned =
        cleaned.slice(
          firstBreak + 1
        );
    }

    if (
      cleaned.endsWith(
        fence
      )
    ) {
      cleaned =
        cleaned.slice(
          0,
          -3
        );
    }
  }

  return JSON.parse(
    cleaned.trim()
  );
}

function buildFreePrompt(
  duration: number,
  totalScore: number,
  sources: SourceItem[]
) {
  const sourceNames =
    sources
      .map(
        (
          source,
          index
        ) =>
          String(
            index + 1
          ) +
          ". " +
          source.name
      )
      .join("\n");

  return [
    "Bạn là chuyên gia kiểm tra, đánh giá giáo dục phổ thông Việt Nam.",
    "",
    "TÔI ĐÃ ĐÍNH KÈM NGAY TRONG TIN NHẮN NÀY các tài liệu/bài học sau:",
    sourceNames ||
      "(Không có danh sách tài liệu.)",
    "",
    "QUY TẮC NGUỒN DỮ LIỆU BẮT BUỘC:",
    "- Chỉ được sử dụng các tệp đính kèm NGAY TRONG TIN NHẮN HIỆN TẠI.",
    "- Không được dùng nội dung, tài liệu, tệp hoặc suy luận từ các cuộc trò chuyện trước.",
    "- Không được coi tên file trong prompt là bằng chứng rằng nội dung file đã được cung cấp.",
    "- Nếu chưa nhìn thấy đầy đủ các tệp nêu trên trong tin nhắn hiện tại, hãy DỪNG và yêu cầu tôi tải đủ tệp; KHÔNG tạo JSON giả, KHÔNG tạo ma trận/đề từ trí nhớ hoặc lịch sử chat.",
    "",
    "Nếu và chỉ nếu đã đọc được đầy đủ các tệp đính kèm hiện tại, hãy đọc toàn bộ tài liệu và tạo đúng theo tinh thần, cấu trúc Phụ lục Công văn 7991/BGDĐT-GDTrH ngày 17/12/2024.",
    "",
    "PHẢI TẠO ĐỦ 6 PHẦN:",
    "1. Ma trận đề kiểm tra định kì.",
    "2. Bản đặc tả đề kiểm tra định kì.",
    "3. Đề kiểm tra Mã 01.",
    "4. Đáp án và hướng dẫn chấm Mã 01.",
    "5. Đề kiểm tra Mã 02.",
    "6. Đáp án và hướng dẫn chấm Mã 02.",
    "",
    "Thời gian: " +
      duration +
      " phút.",
    "Thang điểm: " +
      totalScore +
      ".",
    "Chỉ dùng 3 mức độ: Biết, Hiểu, Vận dụng. Không dùng Vận dụng cao.",
    "Các dạng câu hỏi: TNKQ nhiều lựa chọn; TNKQ Đúng - Sai; TNKQ trả lời ngắn; Tự luận.",
    "Hai mã đề phải tương đương về cấu trúc, độ khó, yêu cầu cần đạt và tổng điểm. Mã 02 phải có thay đổi thực chất phù hợp như hoán đổi câu/phương án hoặc thay số liệu, tình huống, ngữ liệu tương đương.",
    "Chỉ sử dụng kiến thức có trong tài liệu tôi tải lên.",
    "",
    "QUAN TRỌNG: Chỉ trả JSON thuần, không giải thích, không markdown.",
    "JSON phải có đúng các khóa cấp cao:",
    "subject, grade, testTitle, duration, totalScore, scope, matrix, matrixTotals, specification, versions, notes.",
    "versions phải là mảng có đúng 2 phần tử, code lần lượt là 01 và 02.",
    "Mỗi version có sections, answerSummary, notes.",
    "Mỗi section có title, type, questions.",
    "Mỗi question có number, level, topic, score, prompt, options, answer, markingGuide.",
    "",
    "Trước khi trả kết quả hãy tự kiểm tra tổng điểm từng mã bằng " +
      totalScore +
      ", ma trận - đặc tả - hai mã đề - đáp án khớp hoàn toàn."
  ].join(
    "\n"
  );
}

function questionsHtml(
  version: TestVersion,
  answersOnly: boolean
) {
  return (
    version.sections || []
  )
    .map(
      (section) => {
        const questions =
          Array.isArray(
            section.questions
          )
            ? section.questions
            : [];

        if (
          answersOnly
        ) {
          return (
            "<h3>" +
            escapeHtml(
              section.title
            ) +
            "</h3>" +
            questions
              .map(
                (question: any) =>
                  "<p><b>Câu " +
                  escapeHtml(
                    question.number
                  ) +
                  ":</b> " +
                  escapeHtml(
                    question.answer
                  ) +
                  (
                    question.markingGuide
                      ? "<br/>" +
                        escapeHtml(
                          question.markingGuide
                        )
                      : ""
                  ) +
                  "</p>"
              )
              .join("")
          );
        }

        return (
          "<h3>" +
          escapeHtml(
            section.title
          ) +
          "</h3>" +
          questions
            .map(
              (question: any) =>
                "<p><b>Câu " +
                escapeHtml(
                  question.number
                ) +
                ".</b> " +
                escapeHtml(
                  question.prompt
                ) +
                " <i>(" +
                escapeHtml(
                  question.score
                ) +
                " điểm)</i></p>" +
                (
                  Array.isArray(
                    question.options
                  )
                    ? question.options
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
}

export default function Assessment7991Panel({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    mode,
    setMode,
  ] =
    useState<
      "api" |
      "free"
    >("free");

  const [
    apiKey,
    setApiKey,
  ] =
    useState("");

  const [
    sources,
    setSources,
  ] =
    useState<
      SourceItem[]
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

  const [
    freeResult,
    setFreeResult,
  ] =
    useState("");

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ResultTab>(
      "matrix"
    );

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
        MAX_SOURCES -
          sources.length
      );

    const list =
      Array.from(
        files
      ).slice(
        0,
        available
      );

    if (
      list.length === 0
    ) {
      setMessage(
        "Đã đạt giới hạn " +
          MAX_SOURCES +
          " tài liệu."
      );
      return;
    }

    try {
      setMessage(
        "Đang xử lý tài liệu..."
      );

      const next:
        SourceItem[] =
        [];

      for (
        const file of
        list
      ) {
        next.push(
          await prepareSource(
            file
          )
        );
      }

      setSources(
        (current) => [
          ...current,
          ...next,
        ]
      );

      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof
        Error
          ? error.message
          : "Không xử lý được tài liệu."
      );
    }
  }

  function saveApiKey() {
    try {
      localStorage.setItem(
        API_KEY_STORAGE,
        apiKey.trim()
      );

      setMessage(
        "Đã lưu API Key trên trình duyệt này."
      );
    } catch {
      setMessage(
        "Không thể lưu API Key trên trình duyệt."
      );
    }
  }

  async function generateApi() {
    if (
      !apiKey.trim()
    ) {
      setMessage(
        "Hãy nhập API Key OpenAI."
      );
      return;
    }

    if (
      sources.length ===
      0
    ) {
      setMessage(
        "Hãy tải ít nhất một ảnh hoặc tài liệu."
      );
      return;
    }

    setBusy(true);
    setMessage(
      "AI đang tạo ma trận, bản đặc tả, 2 mã đề và đáp án..."
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
                sources:
                  sources.map(
                    (source) => ({
                      name:
                        source.name,
                      kind:
                        source.kind,
                      mime:
                        source.mime,
                      dataUrl:
                        source.dataUrl,
                    })
                  ),
                duration,
                totalScore,
              }),
          }
        );

      const payload =
        await response
          .json()
          .catch(
            () => null
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

      setActiveTab(
        "matrix"
      );

      setMessage(
        "Đã tạo xong 2 mã đề. Hãy kiểm tra trước khi xuất Word."
      );
    } catch (error) {
      setMessage(
        error instanceof
        Error
          ? error.message
          : "Không thể tạo đề."
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyFreePrompt() {
    const prompt =
      buildFreePrompt(
        duration,
        totalScore,
        sources
      );

    try {
      await navigator.clipboard.writeText(
        prompt
      );

      setMessage(
        "Đã sao chép yêu cầu 7991. Hãy mở ChatGPT, tải cùng tài liệu và dán yêu cầu."
      );
    } catch {
      setMessage(
        "Không thể tự sao chép. Hãy thử lại trên trình duyệt."
      );
    }
  }

  function importFreeResult() {
    if (
      !freeResult.trim()
    ) {
      setMessage(
        "Hãy dán JSON ChatGPT trả về."
      );
      return;
    }

    try {
      const parsed =
        parseJsonText(
          freeResult
        );

      if (
        !Array.isArray(
          parsed?.matrix
        ) ||
        parsed.matrix.length === 0
      ) {
        throw new Error(
          "Kết quả không có Ma trận 7991. Có thể ChatGPT chưa nhận được tài liệu nguồn."
        );
      }

      if (
        !Array.isArray(
          parsed?.specification
        ) ||
        parsed.specification.length === 0
      ) {
        throw new Error(
          "Kết quả không có Bản đặc tả. Hãy kiểm tra lại việc tải tài liệu lên ChatGPT."
        );
      }

      if (
        !Array.isArray(
          parsed?.versions
        ) ||
        parsed.versions.length <
          2
      ) {
        throw new Error(
          "Kết quả chưa có đủ 2 mã đề."
        );
      }

      for (
        const version of
        parsed.versions.slice(
          0,
          2
        )
      ) {
        if (
          !Array.isArray(
            version?.sections
          ) ||
          version.sections.length ===
            0
        ) {
          throw new Error(
            "Mã " +
              String(
                version?.code ??
                  ""
              ) +
              " chưa có nội dung đề."
          );
        }

        const questionCount =
          version.sections.reduce(
            (
              total: number,
              section: any
            ) =>
              total +
              (
                Array.isArray(
                  section?.questions
                )
                  ? section.questions.length
                  : 0
              ),
            0
          );

        if (
          questionCount === 0
        ) {
          throw new Error(
            "Mã " +
              String(
                version?.code ??
                  ""
              ) +
              " chưa có câu hỏi. Không nhập kết quả rỗng vào VLEARNING."
          );
        }
      }

      setResult(
        parsed as
          AssessmentResult
      );

      setActiveTab(
        "matrix"
      );

      setMessage(
        "Đã nhập kết quả ChatGPT vào VLEARNING."
      );
    } catch (error) {
      setMessage(
        error instanceof
        Error
          ? error.message
          : "JSON chưa đúng định dạng."
      );
    }
  }

  function resetAll() {
    if (
      sources.length ||
      result ||
      freeResult
    ) {
      if (
        !window.confirm(
          "Xóa tài liệu và kết quả hiện tại?"
        )
      ) {
        return;
      }
    }

    setSources([]);
    setResult(null);
    setFreeResult("");
    setMessage("");
    setActiveTab(
      "matrix"
    );
  }

  function exportWord() {
    if (!result) {
      return;
    }

    const matrixRows =
      (result.matrix || [])
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
              String(
                index + 1
              ) +
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
      (
        result.specification ||
        []
      )
        .map(
          (
            row,
            index
          ) =>
            "<tr><td>" +
            String(
              index + 1
            ) +
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

    const versionsHtml =
      (result.versions || [])
        .slice(
          0,
          2
        )
        .map(
          (version) =>
            "<div class='page-break'></div>" +
            "<h2>III. ĐỀ KIỂM TRA - MÃ " +
            escapeHtml(
              version.code
            ) +
            "</h2>" +
            "<p><b>" +
            escapeHtml(
              result.testTitle
            ) +
            "</b><br/>Thời gian: " +
            escapeHtml(
              result.duration
            ) +
            " phút - Thang điểm: " +
            escapeHtml(
              result.totalScore
            ) +
            "</p>" +
            questionsHtml(
              version,
              false
            ) +
            "<h2>IV. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM - MÃ " +
            escapeHtml(
              version.code
            ) +
            "</h2>" +
            questionsHtml(
              version,
              true
            )
        )
        .join("");

    const html =
      '<!doctype html><html><head><meta charset="utf-8"/>' +
      '<style>@page{size:A4;margin:2cm 2cm 2cm 3cm}body{font-family:"Times New Roman";font-size:13pt;color:#000}h1{text-align:center;font-size:16pt}h2{font-size:14pt;margin-top:18px}h3{font-size:13pt}table{width:100%;border-collapse:collapse;font-size:10pt}th,td{border:1px solid #000;padding:4px;text-align:center;vertical-align:middle}.page-break{page-break-before:always}</style>' +
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
      "<h2>I. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ - CÔNG VĂN 7991/BGDĐT-GDTrH</h2>" +
      '<table><tr><th rowspan="2">TT</th><th rowspan="2">Chủ đề/Chương</th><th rowspan="2">Nội dung/ĐVKT</th><th colspan="3">Nhiều lựa chọn</th><th colspan="3">Đúng - Sai</th><th colspan="3">Trả lời ngắn</th><th colspan="3">Tự luận</th><th rowspan="2">Điểm</th><th rowspan="2">Tỉ lệ %</th></tr>' +
      "<tr><th>Biết</th><th>Hiểu</th><th>VD</th><th>Biết</th><th>Hiểu</th><th>VD</th><th>Biết</th><th>Hiểu</th><th>VD</th><th>Biết</th><th>Hiểu</th><th>VD</th></tr>" +
      matrixRows +
      "</table>" +
      "<h2>II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ</h2>" +
      '<table><tr><th>TT</th><th>Chủ đề/Chương</th><th>Nội dung/ĐVKT</th><th>Biết</th><th>Hiểu</th><th>Vận dụng</th></tr>' +
      specRows +
      "</table>" +
      versionsHtml +
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

    link.href =
      url;

    link.download =
      "Ma-tran-Dac-ta-De-7991-2-ma.doc";

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

  const version01 =
    result?.versions?.[0];

  const version02 =
    result?.versions?.[1];

  function renderVersion(
    version:
      TestVersion |
      undefined,
    answersOnly:
      boolean
  ) {
    if (!version) {
      return (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Chưa có dữ liệu mã đề này.
        </div>
      );
    }

    return (
      <div>
        {(version.sections || []).map(
          (
            section,
            sectionIndex
          ) => (
            <div
              key={
                sectionIndex
              }
              className="mt-4"
            >
              <h4 className="font-black">
                {
                  section.title
                }
              </h4>

              {(section.questions || []).map(
                (
                  question: any,
                  questionIndex: number
                ) => (
                  <div
                    key={
                      questionIndex
                    }
                    className="mt-3"
                  >
                    <b>
                      Câu {
                        question.number
                      }:
                    </b>{" "}
                    {answersOnly
                      ? question.answer
                      : question.prompt}

                    {!answersOnly &&
                      Array.isArray(
                        question.options
                      ) &&
                      question.options.map(
                        (
                          option: string,
                          optionIndex: number
                        ) => (
                          <div
                            key={
                              optionIndex
                            }
                            className="ml-5"
                          >
                            {
                              option
                            }
                          </div>
                        )
                      )}

                    {!answersOnly && (
                      <span className="ml-2 text-sm text-slate-500">
                        ({
                          question.score
                        } điểm)
                      </span>
                    )}

                    {answersOnly &&
                      question.markingGuide && (
                        <div className="ml-5 text-sm text-slate-600">
                          {
                            question.markingGuide
                          }
                        </div>
                      )}
                  </div>
                )
              )}
            </div>
          )
        )}
      </div>
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
          Ma trận • Bản đặc tả • 2 mã đề • Đáp án
        </h1>

        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Nhận ảnh, PDF, DOCX và TXT. Có thể dùng API Key để tạo tự động hoặc dùng ChatGPT miễn phí theo chế độ cầu nối.
        </p>
      </section>

      <section className="mt-5 rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
        <div className="text-sm font-black text-cyan-200">
          1. Chọn phương thức AI
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setMode(
                "free"
              )
            }
            className={
              "rounded-2xl border p-4 text-left " +
              (
                mode ===
                "free"
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-blue-800 bg-[#071f39]"
              )
            }
          >
            <div className="font-black text-emerald-200">
              ChatGPT miễn phí
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-400">
              Không cần API Key. VLEARNING tạo prompt chuẩn, bạn tải cùng tài liệu lên ChatGPT rồi dán JSON kết quả trở lại.
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setMode(
                "api"
              )
            }
            className={
              "rounded-2xl border p-4 text-left " +
              (
                mode ===
                "api"
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-blue-800 bg-[#071f39]"
              )
            }
          >
            <div className="font-black text-cyan-200">
              API Key OpenAI
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-400">
              Tạo tự động ngay trong VLEARNING: phân tích tài liệu, lập ma trận, đặc tả, 2 mã đề và đáp án.
            </div>
          </button>
        </div>

        {mode ===
          "api" && (
          <div className="mt-4">
            <div className="text-xs font-bold text-slate-400">
              API Key cá nhân
            </div>

            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={
                  apiKey
                }
                onChange={(
                  event
                ) =>
                  setApiKey(
                    event.target.value
                  )
                }
                placeholder="sk-..."
                className="min-w-0 flex-1 rounded-xl border border-blue-800 bg-[#071f39] px-3 py-2.5 text-sm"
              />

              <button
                type="button"
                onClick={
                  saveApiKey
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200"
              >
                <Save
                  size={
                    15
                  }
                />
                Lưu Key
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-blue-800/70 pt-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
            <div>
              <div className="text-sm font-black text-cyan-200">
                2. Tài liệu/bài học
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tối đa {MAX_SOURCES} file. Hỗ trợ ảnh, PDF, DOCX, TXT. Có thể trộn nhiều định dạng.
              </p>
            </div>

            <label>
              <span className="text-xs font-bold text-slate-400">
                Thời gian
              </span>

              <select
                value={
                  duration
                }
                onChange={(
                  event
                ) =>
                  setDuration(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-blue-800 bg-[#071f39] px-3 py-2.5 text-sm"
              >
                {[
                  15,
                  30,
                  45,
                  60,
                  90,
                  120,
                ].map(
                  (
                    value
                  ) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    >
                      {
                        value
                      } phút
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
                min={
                  1
                }
                max={
                  100
                }
                value={
                  totalScore
                }
                onChange={(
                  event
                ) =>
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
            ref={
              inputRef
            }
            type="file"
            multiple
            accept="image/*,.pdf,.docx,.txt"
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={
                busy ||
                sources.length >=
                  MAX_SOURCES
              }
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-black text-cyan-200 disabled:opacity-50"
            >
              <ImagePlus
                size={
                  16
                }
              />
              Thêm ảnh / tài liệu
            </button>

            <button
              type="button"
              onClick={
                resetAll
              }
              disabled={
                busy
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-700 bg-[#08233f] px-4 py-2.5 text-xs font-black text-slate-300"
            >
              <RotateCcw
                size={
                  15
                }
              />
              Làm mới
            </button>
          </div>

          {sources.length >
            0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sources.map(
                (
                  source,
                  index
                ) => (
                  <div
                    key={
                      source.id
                    }
                    className="overflow-hidden rounded-xl border border-blue-800 bg-[#071f39]"
                  >
                    {source.kind ===
                    "image" ? (
                      <img
                        src={
                          source.dataUrl
                        }
                        alt={
                          source.name
                        }
                        className="aspect-[4/3] w-full object-contain"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-[#092745]">
                        <FileText
                          size={
                            42
                          }
                          className="text-cyan-300"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 p-2">
                      <div className="min-w-0">
                        <div className="truncate text-[10px] text-slate-300">
                          {index +
                            1}.{" "}
                          {
                            source.name
                          }
                        </div>

                        <div className="mt-0.5 text-[9px] uppercase text-slate-500">
                          {source.kind ===
                          "image"
                            ? "Ảnh"
                            : source.name
                                .split(
                                  "."
                                )
                                .pop()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSources(
                            (
                              current
                            ) =>
                              current.filter(
                                (
                                  item
                                ) =>
                                  item.id !==
                                  source.id
                              )
                          )
                        }
                        className="text-red-400"
                      >
                        <Trash2
                          size={
                            14
                          }
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {mode ===
        "api" ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={
                generateApi
              }
              disabled={
                busy ||
                sources.length ===
                  0
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-black disabled:opacity-50"
            >
              {busy ? (
                <Loader2
                  size={
                    18
                  }
                  className="animate-spin"
                />
              ) : (
                <Sparkles
                  size={
                    18
                  }
                />
              )}

              {busy
                ? "AI đang tạo..."
                : "TẠO MA TRẬN + ĐẶC TẢ + 2 MÃ ĐỀ"}
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <div className="font-black text-emerald-200">
              3. Dùng ChatGPT miễn phí
            </div>

            <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
              <b>Lưu ý quan trọng:</b> tài liệu bạn chọn trong VLEARNING không tự chuyển sang ChatGPT. Sau khi mở ChatGPT, bạn phải tải lại đúng các file này vào chính tin nhắn ChatGPT trước khi dán yêu cầu.
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Bước 1: mở ChatGPT. Bước 2: tải lại đúng {sources.length} file đã chọn ở VLEARNING vào ChatGPT. Bước 3: sao chép và dán yêu cầu 7991. Bước 4: chờ ChatGPT tạo đủ ma trận, đặc tả, Mã 01, đáp án Mã 01, Mã 02, đáp án Mã 02. Bước 5: sao chép toàn bộ JSON trả về và dán lại bên dưới.
            </p>

            {sources.length > 0 && (
              <div className="mt-3 rounded-xl border border-blue-800 bg-[#071f39] p-3">
                <div className="text-[11px] font-black text-cyan-200">
                  Các file phải tải lại lên ChatGPT:
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                  {sources.map(
                    (
                      source,
                      index
                    ) => (
                      <div
                        key={
                          source.id
                        }
                      >
                        {index + 1}. {source.name}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void copyFreePrompt()
                }
                disabled={
                  sources.length ===
                  0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                <Clipboard
                  size={
                    15
                  }
                />
                Sao chép yêu cầu 7991
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://chatgpt.com/",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-black text-emerald-200"
              >
                <ExternalLink
                  size={
                    15
                  }
                />
                Mở ChatGPT miễn phí
              </button>
            </div>

            <textarea
              value={
                freeResult
              }
              onChange={(
                event
              ) =>
                setFreeResult(
                  event.target.value
                )
              }
              placeholder="Dán toàn bộ JSON ChatGPT trả về vào đây..."
              className="mt-4 min-h-[180px] w-full rounded-xl border border-blue-800 bg-[#071f39] p-3 font-mono text-xs text-slate-200"
            />

            <button
              type="button"
              onClick={
                importFreeResult
              }
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-black text-white"
            >
              <Sparkles
                size={
                  17
                }
              />
              Nhập kết quả vào VLEARNING
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-blue-800 bg-[#071f39] px-4 py-3 text-xs leading-5 text-slate-300">
            {
              message
            }
          </div>
        )}
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
                {
                  result.subject
                }{" "}
                • Lớp{" "}
                {
                  result.grade
                }{" "}
                •{" "}
                {
                  result.duration
                }{" "}
                phút •{" "}
                {
                  result.totalScore
                }{" "}
                điểm • 2 mã đề
              </div>
            </div>

            <button
              type="button"
              onClick={
                exportWord
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
            >
              <FileDown
                size={
                  17
                }
              />
              Xuất Word toàn bộ
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              [
                "matrix",
                "Ma trận 7991",
              ],
              [
                "spec",
                "Bản đặc tả",
              ],
              [
                "code01",
                "Đề - Mã 01",
              ],
              [
                "answer01",
                "Đáp án - Mã 01",
              ],
              [
                "code02",
                "Đề - Mã 02",
              ],
              [
                "answer02",
                "Đáp án - Mã 02",
              ],
            ].map(
              (
                item
              ) => (
                <button
                  key={
                    item[0]
                  }
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      item[0] as
                        ResultTab
                    )
                  }
                  className={
                    "rounded-lg px-3 py-2 text-xs font-black " +
                    (
                      activeTab ===
                      item[0]
                        ? "bg-blue-700 text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    )
                  }
                >
                  {
                    item[1]
                  }
                </button>
              )
            )}
          </div>

          {activeTab ===
            "matrix" && (
            <div className="mt-5 overflow-x-auto">
              <h3 className="mb-2 text-lg font-black">
                Ma trận đề kiểm tra định kì
              </h3>

              <table className="min-w-[1100px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border p-2">
                      TT
                    </th>
                    <th className="border p-2">
                      Chủ đề/Chương
                    </th>
                    <th className="border p-2">
                      Nội dung/ĐVKT
                    </th>
                    <th className="border p-2">
                      MC-Biết
                    </th>
                    <th className="border p-2">
                      MC-Hiểu
                    </th>
                    <th className="border p-2">
                      MC-VD
                    </th>
                    <th className="border p-2">
                      Đ/S-Biết
                    </th>
                    <th className="border p-2">
                      Đ/S-Hiểu
                    </th>
                    <th className="border p-2">
                      Đ/S-VD
                    </th>
                    <th className="border p-2">
                      TLN-Biết
                    </th>
                    <th className="border p-2">
                      TLN-Hiểu
                    </th>
                    <th className="border p-2">
                      TLN-VD
                    </th>
                    <th className="border p-2">
                      TL-Biết
                    </th>
                    <th className="border p-2">
                      TL-Hiểu
                    </th>
                    <th className="border p-2">
                      TL-VD
                    </th>
                    <th className="border p-2">
                      Điểm
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(result.matrix || []).map(
                    (
                      row,
                      index
                    ) => (
                      <tr
                        key={
                          index
                        }
                      >
                        <td className="border p-2 text-center">
                          {index +
                            1}
                        </td>

                        <td className="border p-2">
                          {
                            row.topic
                          }
                        </td>

                        <td className="border p-2">
                          {
                            row.knowledgeUnit
                          }
                        </td>

                        {[
                          row.multipleChoice,
                          row.trueFalse,
                          row.shortAnswer,
                          row.essay,
                        ]
                          .flatMap(
                            (
                              group
                            ) => [
                              group?.know ??
                                0,
                              group?.understand ??
                                0,
                              group?.apply ??
                                0,
                            ]
                          )
                          .map(
                            (
                              value,
                              cellIndex
                            ) => (
                              <td
                                key={
                                  cellIndex
                                }
                                className="border p-2 text-center"
                              >
                                {
                                  value
                                }
                              </td>
                            )
                          )}

                        <td className="border p-2 text-center font-bold">
                          {
                            row.totalScore
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab ===
            "spec" && (
            <div className="mt-5 overflow-x-auto">
              <h3 className="mb-2 text-lg font-black">
                Bản đặc tả đề kiểm tra định kì
              </h3>

              <table className="min-w-[900px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border p-2">
                      TT
                    </th>
                    <th className="border p-2">
                      Chủ đề/Chương
                    </th>
                    <th className="border p-2">
                      Nội dung/ĐVKT
                    </th>
                    <th className="border p-2">
                      Biết
                    </th>
                    <th className="border p-2">
                      Hiểu
                    </th>
                    <th className="border p-2">
                      Vận dụng
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(result.specification || []).map(
                    (
                      row,
                      index
                    ) => (
                      <tr
                        key={
                          index
                        }
                      >
                        <td className="border p-2 text-center">
                          {index +
                            1}
                        </td>

                        <td className="border p-2">
                          {
                            row.topic
                          }
                        </td>

                        <td className="border p-2">
                          {
                            row.knowledgeUnit
                          }
                        </td>

                        <td className="border p-2">
                          {
                            row.requirements
                              ?.know
                          }
                        </td>

                        <td className="border p-2">
                          {
                            row.requirements
                              ?.understand
                          }
                        </td>

                        <td className="border p-2">
                          {
                            row.requirements
                              ?.apply
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab ===
            "code01" && (
            <div className="mt-5">
              <h3 className="text-lg font-black">
                Đề kiểm tra - Mã 01
              </h3>
              {
                renderVersion(
                  version01,
                  false
                )
              }
            </div>
          )}

          {activeTab ===
            "answer01" && (
            <div className="mt-5">
              <h3 className="text-lg font-black">
                Đáp án và hướng dẫn chấm - Mã 01
              </h3>
              {
                renderVersion(
                  version01,
                  true
                )
              }
            </div>
          )}

          {activeTab ===
            "code02" && (
            <div className="mt-5">
              <h3 className="text-lg font-black">
                Đề kiểm tra - Mã 02
              </h3>
              {
                renderVersion(
                  version02,
                  false
                )
              }
            </div>
          )}

          {activeTab ===
            "answer02" && (
            <div className="mt-5">
              <h3 className="text-lg font-black">
                Đáp án và hướng dẫn chấm - Mã 02
              </h3>
              {
                renderVersion(
                  version02,
                  true
                )
              }
            </div>
          )}
        </section>
      )}
    </div>
  );
}
