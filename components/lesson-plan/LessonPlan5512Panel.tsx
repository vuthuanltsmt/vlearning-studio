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

  function exportWord() {
    const digitalSummary =
      selectedDigitalIds.length
        ? selectedDigitalIds
            .map(
              competencyLabel
            )
            .join(
              "; "
            )
        : "Chưa lựa chọn";

    const activityRows =
      draft.activities
        .map(
          (
            activity,
            index
          ) => `
          <h3>${escapeHtml(
            activity.title
          )}</h3>
          <table>
            <tr><td><b>a) Mục tiêu</b></td><td>${textToHtml(
              activity.objective
            )}</td></tr>
            <tr><td><b>b) Nội dung</b></td><td>${textToHtml(
              activity.content
            )}</td></tr>
            <tr><td><b>c) Sản phẩm</b></td><td>${textToHtml(
              activity.product
            )}</td></tr>
            <tr><td><b>d) Tổ chức thực hiện</b></td><td>${textToHtml(
              activity.organization
            )}</td></tr>
            <tr><td><b>Năng lực số tích hợp</b></td><td>${
              activity.digitalIds.length
                ? activity.digitalIds
                    .map(
                      competencyLabel
                    )
                    .map(
                      escapeHtml
                    )
                    .join(
                      "<br/>"
                    )
                : "Không chọn"
            }</td></tr>
          </table>
          ${
            index <
            draft.activities.length -
              1
              ? "<br/>"
              : ""
          }
        `
        )
        .join("");

    const html =
      `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.35;color:#000}
          h1{text-align:center;font-size:16pt;margin:10px 0 4px}
          h2{font-size:14pt;margin:14px 0 6px}
          h3{font-size:13pt;margin:12px 0 5px}
          table{width:100%;border-collapse:collapse;margin:5px 0 10px}
          td{border:1px solid #000;padding:6px;vertical-align:top}
          td:first-child{width:28%}
          .meta{text-align:center;margin-bottom:12px}
        </style>
      </head>
      <body>
        <div>TRƯỜNG: ${escapeHtml(
          draft.school
        )}</div>
        <div>GIÁO VIÊN: ${escapeHtml(
          draft.teacher
        )}</div>
        <h1>KẾ HOẠCH BÀI DẠY</h1>
        <div class="meta"><b>TÊN BÀI DẠY: ${escapeHtml(
          draft.lessonTitle
        )}</b><br/>
        Môn học/Hoạt động giáo dục: ${escapeHtml(
          draft.subject
        )}; Lớp: ${escapeHtml(
          draft.grade
        )}<br/>
        Thời gian thực hiện: ${escapeHtml(
          draft.periods
        )} tiết</div>

        <h2>I. MỤC TIÊU</h2>
        <p><b>1. Về kiến thức:</b><br/>${textToHtml(
          draft.knowledgeObjectives
        )}</p>
        <p><b>2. Về năng lực:</b><br/>${textToHtml(
          draft.competencies
        )}</p>
        <p><b>3. Về phẩm chất:</b><br/>${textToHtml(
          draft.qualities
        )}</p>
        <p><b>4. Năng lực số tích hợp:</b><br/>${escapeHtml(
          digitalSummary
        )}<br/><i>Mức/bậc dự kiến: Bậc ${escapeHtml(
          draft.digitalLevel
        )}</i></p>

        <h2>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
        <p>${textToHtml(
          draft.equipment
        )}</p>

        <h2>III. TIẾN TRÌNH DẠY HỌC</h2>
        ${activityRows}

        <h2>IV. HỒ SƠ DẠY HỌC KHÁC (NẾU CÓ)</h2>
        <p>Phiếu học tập, công cụ đánh giá, học liệu số, sản phẩm học sinh và các minh chứng liên quan.</p>
      </body>
      </html>`;

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

    const anchor =
      document.createElement(
        "a"
      );

    const safeName =
      (
        draft.lessonTitle ||
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
      `${safeName || "Giao-an-5512"}.doc`;

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
