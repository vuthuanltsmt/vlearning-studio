import JSZip from "jszip";
"use client";

import {
  BookOpenCheck,
  FileDown,
  RotateCcw,
  Save,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type DigitalCompetency = {
  id: string;
  domain: string;
  name: string;
};

type LessonActivity = {
  id:
    | "opening"
    | "knowledge"
    | "practice"
    | "application";
  title: string;
  objective: string;
  content: string;
  product: string;
  organization: string;
  digitalIds: string[];
};

type LessonPlanDraft = {
  school: string;
  teacher: string;
  subject: string;
  grade: string;
  lessonTitle: string;
  periods: string;
  knowledgeObjectives: string;
  competencies: string;
  qualities: string;
  equipment: string;
  digitalLevel: string;
  activities: LessonActivity[];
};

const STORAGE_KEY =
  "vlearning-lesson-plan-5512-v1";

const DIGITAL_DOMAINS: Array<{
  title: string;
  items: DigitalCompetency[];
}> = [
  {
    title:
      "I. Khai thác dữ liệu và thông tin",
    items: [
      {
        id: "1.1",
        domain: "I",
        name:
          "Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số",
      },
      {
        id: "1.2",
        domain: "I",
        name:
          "Đánh giá dữ liệu, thông tin và nội dung số",
      },
      {
        id: "1.3",
        domain: "I",
        name:
          "Quản lý dữ liệu, thông tin và nội dung số",
      },
    ],
  },
  {
    title:
      "II. Giao tiếp và hợp tác trong môi trường số",
    items: [
      {
        id: "2.1",
        domain: "II",
        name:
          "Tương tác thông qua công nghệ số",
      },
      {
        id: "2.2",
        domain: "II",
        name:
          "Chia sẻ thông tin, nội dung số thông qua công nghệ số",
      },
      {
        id: "2.3",
        domain: "II",
        name:
          "Tham gia với tư cách công dân thông qua công nghệ số",
      },
      {
        id: "2.4",
        domain: "II",
        name:
          "Hợp tác thông qua công nghệ số",
      },
      {
        id: "2.5",
        domain: "II",
        name:
          "Thực hiện quy tắc ứng xử trên mạng",
      },
      {
        id: "2.6",
        domain: "II",
        name:
          "Quản lý danh tính số",
      },
    ],
  },
  {
    title:
      "III. Sáng tạo nội dung số",
    items: [
      {
        id: "3.1",
        domain: "III",
        name:
          "Phát triển nội dung số",
      },
      {
        id: "3.2",
        domain: "III",
        name:
          "Tích hợp và tạo lập lại nội dung số",
      },
      {
        id: "3.3",
        domain: "III",
        name:
          "Thực thi bản quyền và giấy phép",
      },
      {
        id: "3.4",
        domain: "III",
        name:
          "Lập trình",
      },
    ],
  },
  {
    title:
      "IV. An toàn",
    items: [
      {
        id: "4.1",
        domain: "IV",
        name:
          "Bảo vệ thiết bị",
      },
      {
        id: "4.2",
        domain: "IV",
        name:
          "Bảo vệ dữ liệu cá nhân và quyền riêng tư",
      },
      {
        id: "4.3",
        domain: "IV",
        name:
          "Bảo vệ sức khỏe và an sinh số",
      },
      {
        id: "4.4",
        domain: "IV",
        name:
          "Bảo vệ môi trường",
      },
    ],
  },
  {
    title:
      "V. Giải quyết vấn đề",
    items: [
      {
        id: "5.1",
        domain: "V",
        name:
          "Giải quyết các vấn đề kỹ thuật",
      },
      {
        id: "5.2",
        domain: "V",
        name:
          "Xác định nhu cầu và giải pháp công nghệ",
      },
      {
        id: "5.3",
        domain: "V",
        name:
          "Sử dụng sáng tạo công nghệ số",
      },
      {
        id: "5.4",
        domain: "V",
        name:
          "Xác định khoảng cách về năng lực số",
      },
    ],
  },
  {
    title:
      "VI. Ứng dụng trí tuệ nhân tạo",
    items: [
      {
        id: "6.1",
        domain: "VI",
        name:
          "Hiểu biết về AI (trong đó có Gen AI)",
      },
      {
        id: "6.2",
        domain: "VI",
        name:
          "Sử dụng AI có đạo đức và trách nhiệm",
      },
      {
        id: "6.3",
        domain: "VI",
        name:
          "Đánh giá các công cụ AI",
      },
    ],
  },
];

const ALL_DIGITAL =
  DIGITAL_DOMAINS.flatMap(
    (domain) =>
      domain.items
  );

function defaultDraft():
  LessonPlanDraft {
  return {
    school: "",
    teacher: "",
    subject: "",
    grade: "",
    lessonTitle: "",
    periods: "1",
    knowledgeObjectives: "",
    competencies: "",
    qualities: "",
    equipment: "",
    digitalLevel: "3",
    activities: [
      {
        id: "opening",
        title:
          "Hoạt động 1. Mở đầu",
        objective: "",
        content: "",
        product: "",
        organization: "",
        digitalIds: [],
      },
      {
        id: "knowledge",
        title:
          "Hoạt động 2. Hình thành kiến thức mới",
        objective: "",
        content: "",
        product: "",
        organization: "",
        digitalIds: [],
      },
      {
        id: "practice",
        title:
          "Hoạt động 3. Luyện tập",
        objective: "",
        content: "",
        product: "",
        organization: "",
        digitalIds: [],
      },
      {
        id: "application",
        title:
          "Hoạt động 4. Vận dụng",
        objective: "",
        content: "",
        product: "",
        organization: "",
        digitalIds: [],
      },
    ],
  };
}

function escapeHtml(
  value: string
) {
  return value
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
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function textToHtml(
  value: string
) {
  return escapeHtml(
    value.trim()
  ).replace(
    /\n/g,
    "<br/>"
  );
}

function competencyLabel(
  id: string
) {
  const item =
    ALL_DIGITAL.find(
      (entry) =>
        entry.id ===
        id
    );

  return item
    ? `${item.id}. ${item.name}`
    : id;
}

export default function LessonPlan5512Panel({
  onOpenMenu,
}: {
  onOpenMenu:
    () => void;
}) {
  const [
    draft,
    setDraft,
  ] =
    useState<LessonPlanDraft>(
      defaultDraft
    );

  const [
    savedFlash,
    setSavedFlash,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (raw) {
        const parsed =
          JSON.parse(
            raw
          ) as
          Partial<LessonPlanDraft>;

        setDraft({
          ...defaultDraft(),
          ...parsed,
          activities:
            Array.isArray(
              parsed.activities
            ) &&
            parsed.activities.length ===
              4
              ? parsed.activities
              : defaultDraft()
                  .activities,
        });
      }
    } catch {
      // Giữ bản mặc định.
    }
  }, []);

  const selectedDigitalIds =
    useMemo(
      () =>
        Array.from(
          new Set(
            draft.activities.flatMap(
              (activity) =>
                activity.digitalIds
            )
          )
        ),
      [
        draft.activities,
      ]
    );

  function patch(
    key:
      Exclude<
        keyof LessonPlanDraft,
        "activities"
      >,
    value: string
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  function patchActivity(
    index: number,
    field:
      keyof Omit<
        LessonActivity,
        "id"
      >,
    value:
      string |
      string[]
  ) {
    setDraft(
      (current) => ({
        ...current,
        activities:
          current.activities.map(
            (
              activity,
              activityIndex
            ) =>
              activityIndex ===
              index
                ? {
                    ...activity,
                    [field]:
                      value,
                  }
                : activity
          ),
      })
    );
  }

  function toggleDigital(
    activityIndex: number,
    id: string
  ) {
    const source =
      draft.activities[
        activityIndex
      ].digitalIds;

    patchActivity(
      activityIndex,
      "digitalIds",
      source.includes(
        id
      )
        ? source.filter(
            (item) =>
              item !==
              id
          )
        : [
            ...source,
            id,
          ]
    );
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          draft
        )
      );

      setSavedFlash(
        true
      );

      window.setTimeout(
        () =>
          setSavedFlash(
            false
          ),
        1500
      );
    } catch {
      window.alert(
        "Không thể lưu giáo án trên trình duyệt."
      );
    }
  }

  function resetDraft() {
    if (
      !window.confirm(
        "Xóa nội dung giáo án đang soạn và tạo lại mẫu trống?"
      )
    ) {
      return;
    }

    const next =
      defaultDraft();

    setDraft(
      next
    );

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Không ảnh hưởng thao tác reset.
    }
  }

  async function exportWord() {
    // A real Office Open XML .docx document, rather than HTML renamed to .doc.
    const xml = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const run = (value: string, bold = false) =>
      "<w:r><w:rPr>" +
      (bold ? "<w:b/>" : "") +
      '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>' +
      '<w:sz w:val="26"/></w:rPr><w:t xml:space="preserve">' +
      xml(value) + "</w:t></w:r>";

    const paragraph = (value: string, bold = false, centered = false) =>
      '<w:p><w:pPr>' +
      (centered ? '<w:jc w:val="center"/>' : "") +
      '<w:spacing w:after="120"/></w:pPr>' +
      value.split("\n").map((line, index) =>
        (index ? "<w:r><w:br/></w:r>" : "") + run(line, bold)
      ).join("") + "</w:p>";

    const cell = (value: string, bold = false) =>
      '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>' +
      '<w:tcBorders><w:top w:val="single" w:sz="6"/>' +
      '<w:left w:val="single" w:sz="6"/>' +
      '<w:bottom w:val="single" w:sz="6"/>' +
      '<w:right w:val="single" w:sz="6"/></w:tcBorders></w:tcPr>' +
      paragraph(value, bold) + "</w:tc>";

    const rows = (pairs: Array<[string, string]>) =>
      '<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/>' +
      '<w:tblBorders><w:top w:val="single"/><w:left w:val="single"/>' +
      '<w:bottom w:val="single"/><w:right w:val="single"/>' +
      '<w:insideH w:val="single"/><w:insideV w:val="single"/>' +
      '</w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2700"/>' +
      '<w:gridCol w:w="6660"/></w:tblGrid>' +
      pairs.map(([label, value]) =>
        "<w:tr>" + cell(label, true) + cell(value) + "</w:tr>"
      ).join("") + "</w:tbl>";

    const selected = Array.from(new Set(
      draft.activities.flatMap((activity) => activity.digitalIds)
    ));
    const competencies = selected.length
      ? selected.map(competencyLabel).join("; ")
      : "Chưa lựa chọn";

    const parts: string[] = [
      paragraph("TRƯỜNG: " + draft.school),
      paragraph("GIÁO VIÊN: " + draft.teacher),
      paragraph("KẾ HOẠCH BÀI DẠY", true, true),
      paragraph("TÊN BÀI DẠY: " + draft.lessonTitle, true, true),
      paragraph("Môn học/Hoạt động giáo dục: " + draft.subject +
        "; Lớp: " + draft.grade, false, true),
      paragraph("Thời gian thực hiện: " + draft.periods + " tiết", false, true),
      paragraph("I. MỤC TIÊU", true),
      paragraph("1. Về kiến thức:", true),
      paragraph(draft.knowledgeObjectives),
      paragraph("2. Về năng lực:", true),
      paragraph(draft.competencies),
      paragraph("3. Về phẩm chất:", true),
      paragraph(draft.qualities),
      paragraph("4. Năng lực số tích hợp:", true),
      paragraph(competencies),
      paragraph("Mức/bậc dự kiến: Bậc " + draft.digitalLevel),
      paragraph("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", true),
      paragraph(draft.equipment),
      paragraph("III. TIẾN TRÌNH DẠY HỌC", true),
    ];

    for (const activity of draft.activities) {
      parts.push(paragraph(activity.title, true));
      parts.push(rows([
        ["a) Mục tiêu", activity.objective],
        ["b) Nội dung", activity.content],
        ["c) Sản phẩm", activity.product],
        ["d) Tổ chức thực hiện", activity.organization],
        ["Năng lực số tích hợp", activity.digitalIds.length
          ? activity.digitalIds.map(competencyLabel).join("\n")
          : "Không chọn"],
      ]));
    }
    parts.push(paragraph("IV. HỒ SƠ DẠY HỌC KHÁC (NẾU CÓ)", true));
    parts.push(paragraph(
      "Phiếu học tập, công cụ đánh giá, học liệu số, sản phẩm học sinh và các minh chứng liên quan."
    ));

    const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' + parts.join("") +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1417"/>' +
      '</w:sectPr></w:body></w:document>';

    try {
      const zip = new JSZip();
      zip.file("[Content_Types].xml",
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>');
      zip.file("_rels/.rels",
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>');
      zip.file("word/document.xml", documentXml);
      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const filename = (draft.lessonTitle || "Giao-an-5512")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "Giao-an-5512";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename + ".docx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert("Không thể xuất tệp Word. Vui lòng thử lại.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 xl:hidden">
        <button
          type="button"
          onClick={
            onOpenMenu
          }
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300"
          aria-label="Mở menu"
        >
          ☰
        </button>

        <div>
          <div className="text-lg font-black text-cyan-300">
            VLEARNING STUDIO
          </div>
          <div className="text-[10px] text-slate-400">
            Giáo án 5512
          </div>
        </div>
      </div>

      <section className="rounded-[24px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.15em] text-cyan-300">
              Kế hoạch bài dạy
            </div>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-black">
              <BookOpenCheck
                className="text-cyan-300"
              />
              Giáo án 5512 + Năng lực số
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Soạn kế hoạch bài dạy theo cấu trúc Công văn 5512 và tích hợp Khung năng lực số cho người học theo Thông tư 02/2025/TT-BGDĐT.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                resetDraft
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-[#0a294a] px-4 py-2.5 text-xs font-black text-slate-200"
            >
              <RotateCcw
                size={15}
              />
              Làm mới
            </button>

            <button
              type="button"
              onClick={
                saveDraft
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black hover:bg-emerald-500"
            >
              <Save
                size={15}
              />
              {savedFlash
                ? "Đã lưu ✓"
                : "Lưu giáo án"}
            </button>

            <button
              type="button"
              onClick={
                exportWord
              }
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-black"
            >
              <FileDown
                size={15}
              />
              Xuất Word
            </button>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
            <h2 className="text-lg font-black text-cyan-200">
              1. Thông tin bài dạy
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                [
                  "school",
                  "Trường",
                ],
                [
                  "teacher",
                  "Giáo viên",
                ],
                [
                  "subject",
                  "Môn học/HĐGD",
                ],
                [
                  "grade",
                  "Lớp",
                ],
                [
                  "lessonTitle",
                  "Tên bài dạy",
                ],
                [
                  "periods",
                  "Số tiết",
                ],
              ].map(
                (
                  [
                    key,
                    label,
                  ]
                ) => (
                  <label
                    key={
                      key
                    }
                    className={
                      key ===
                      "lessonTitle"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <span className="text-xs font-bold text-slate-400">
                      {label}
                    </span>
                    <input
                      value={
                        draft[
                          key as
                            keyof Pick<
                              LessonPlanDraft,
                              "school" |
                              "teacher" |
                              "subject" |
                              "grade" |
                              "lessonTitle" |
                              "periods"
                            >
                        ] as string
                      }
                      onChange={(
                        event
                      ) =>
                        patch(
                          key as
                            Exclude<
                              keyof LessonPlanDraft,
                              "activities"
                            >,
                          event.target.value
                        )
                      }
                      className="mt-1.5 w-full rounded-xl border border-blue-800 bg-[#071f39] px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </label>
                )
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
            <h2 className="text-lg font-black text-cyan-200">
              2. Mục tiêu và học liệu
            </h2>

            {[
              [
                "knowledgeObjectives",
                "Kiến thức",
              ],
              [
                "competencies",
                "Năng lực chung và năng lực đặc thù",
              ],
              [
                "qualities",
                "Phẩm chất",
              ],
              [
                "equipment",
                "Thiết bị dạy học và học liệu",
              ],
            ].map(
              (
                [
                  key,
                  label,
                ]
              ) => (
                <label
                  key={
                    key
                  }
                  className="mt-4 block"
                >
                  <span className="text-xs font-bold text-slate-400">
                    {label}
                  </span>
                  <textarea
                    rows={
                      3
                    }
                    value={
                      draft[
                        key as
                          "knowledgeObjectives" |
                          "competencies" |
                          "qualities" |
                          "equipment"
                      ]
                    }
                    onChange={(
                      event
                    ) =>
                      patch(
                        key as
                          "knowledgeObjectives" |
                          "competencies" |
                          "qualities" |
                          "equipment",
                        event.target.value
                      )
                    }
                    className="mt-1.5 w-full resize-y rounded-xl border border-blue-800 bg-[#071f39] px-3 py-2.5 text-sm leading-6 outline-none focus:border-cyan-500"
                  />
                </label>
              )
            )}
          </section>

          <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-cyan-200">
                  3. Tiến trình dạy học
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Mỗi hoạt động gồm mục tiêu, nội dung, sản phẩm và tổ chức thực hiện.
                </p>
              </div>

              <label className="text-xs font-bold text-slate-400">
                Bậc NLS dự kiến
                <select
                  value={
                    draft.digitalLevel
                  }
                  onChange={(
                    event
                  ) =>
                    patch(
                      "digitalLevel",
                      event.target.value
                    )
                  }
                  className="ml-2 rounded-lg border border-blue-800 bg-[#071f39] px-2 py-1.5 text-white"
                >
                  {Array.from(
                    {
                      length:
                        8,
                    },
                    (
                      _,
                      index
                    ) =>
                      index +
                      1
                  ).map(
                    (
                      level
                    ) => (
                      <option
                        key={
                          level
                        }
                        value={
                          String(
                            level
                          )
                        }
                      >
                        Bậc {level}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-4">
              {draft.activities.map(
                (
                  activity,
                  index
                ) => (
                  <div
                    key={
                      activity.id
                    }
                    className="rounded-2xl border border-blue-800 bg-[#08233f] p-4"
                  >
                    <input
                      value={
                        activity.title
                      }
                      onChange={(
                        event
                      ) =>
                        patchActivity(
                          index,
                          "title",
                          event.target.value
                        )
                      }
                      className="w-full bg-transparent text-base font-black text-amber-200 outline-none"
                    />

                    <div className="mt-3 grid gap-3">
                      {[
                        [
                          "objective",
                          "a) Mục tiêu",
                        ],
                        [
                          "content",
                          "b) Nội dung",
                        ],
                        [
                          "product",
                          "c) Sản phẩm",
                        ],
                        [
                          "organization",
                          "d) Tổ chức thực hiện",
                        ],
                      ].map(
                        (
                          [
                            field,
                            label,
                          ]
                        ) => (
                          <label
                            key={
                              field
                            }
                          >
                            <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              {label}
                            </span>
                            <textarea
                              rows={
                                field ===
                                "organization"
                                  ? 4
                                  : 2
                              }
                              value={
                                activity[
                                  field as
                                    "objective" |
                                    "content" |
                                    "product" |
                                    "organization"
                                ]
                              }
                              onChange={(
                                event
                              ) =>
                                patchActivity(
                                  index,
                                  field as
                                    "objective" |
                                    "content" |
                                    "product" |
                                    "organization",
                                  event.target.value
                                )
                              }
                              className="mt-1 w-full resize-y rounded-xl border border-blue-900 bg-[#061a31] px-3 py-2 text-sm leading-6 outline-none focus:border-cyan-500"
                            />
                          </label>
                        )
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] font-black uppercase tracking-wide text-cyan-300">
                        Năng lực số tích hợp trong hoạt động
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {activity.digitalIds.length ===
                        0 ? (
                          <span className="text-xs text-slate-500">
                            Chưa lựa chọn.
                          </span>
                        ) : (
                          activity.digitalIds.map(
                            (
                              id
                            ) => (
                              <button
                                key={
                                  id
                                }
                                type="button"
                                onClick={() =>
                                  toggleDigital(
                                    index,
                                    id
                                  )
                                }
                                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200"
                                title="Bấm để bỏ chọn"
                              >
                                {id} ×
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
            <h2 className="text-lg font-black text-cyan-200">
              Thư viện năng lực số
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Chọn năng lực cho từng hoạt động. Khung gồm 6 miền và 24 năng lực thành phần.
            </p>

            <div className="mt-4 space-y-4">
              {DIGITAL_DOMAINS.map(
                (
                  domain
                ) => (
                  <div
                    key={
                      domain.title
                    }
                    className="rounded-xl border border-blue-900 bg-[#08233f] p-3"
                  >
                    <div className="text-xs font-black text-amber-200">
                      {
                        domain.title
                      }
                    </div>

                    <div className="mt-2 space-y-2">
                      {domain.items.map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.id
                            }
                            className="rounded-lg border border-blue-900/80 bg-[#061a31] p-2.5"
                          >
                            <div className="text-xs font-bold text-slate-200">
                              <span className="mr-1 text-cyan-300">
                                {item.id}
                              </span>
                              {item.name}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {draft.activities.map(
                                (
                                  activity,
                                  activityIndex
                                ) => {
                                  const selected =
                                    activity.digitalIds.includes(
                                      item.id
                                    );

                                  return (
                                    <button
                                      key={
                                        activity.id
                                      }
                                      type="button"
                                      onClick={() =>
                                        toggleDigital(
                                          activityIndex,
                                          item.id
                                        )
                                      }
                                      className={
                                        selected
                                          ? "rounded-md bg-emerald-600 px-2 py-1 text-[9px] font-black text-white"
                                          : "rounded-md border border-blue-800 px-2 py-1 text-[9px] font-bold text-slate-400 hover:border-cyan-500/50 hover:text-cyan-200"
                                      }
                                    >
                                      HĐ{
                                        activityIndex +
                                        1
                                      }
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h2 className="text-base font-black text-emerald-200">
              Tóm tắt giáo án
            </h2>

            <div className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
              <div>
                <b>Bài:</b>{" "}
                {draft.lessonTitle ||
                  "Chưa nhập"}
              </div>
              <div>
                <b>Môn/Lớp:</b>{" "}
                {draft.subject ||
                  "—"}{" "}
                /{" "}
                {draft.grade ||
                  "—"}
              </div>
              <div>
                <b>Thời lượng:</b>{" "}
                {draft.periods ||
                  "—"}{" "}
                tiết
              </div>
              <div>
                <b>Năng lực số:</b>{" "}
                {
                  selectedDigitalIds.length
                }{" "}
                thành phần • Bậc{" "}
                {
                  draft.digitalLevel
                }
              </div>
            </div>

            {selectedDigitalIds.length >
              0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedDigitalIds.map(
                  (
                    id
                  ) => (
                    <span
                      key={
                        id
                      }
                      className="rounded-full bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-200"
                    >
                      {id}
                    </span>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
