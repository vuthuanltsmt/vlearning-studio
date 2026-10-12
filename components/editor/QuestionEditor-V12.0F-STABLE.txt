"use client";

import {
  Save,
  X,
} from "lucide-react";

import {
  formatTime,
} from "@/types/lesson";

import type {
  QuizDraft,
  QuizType,
} from "@/types/lesson";

type Props = {
  open: boolean;

  editing: boolean;

  draft: QuizDraft;

  time: number;

  duration: number;

  onDraftChange: (
    draft: QuizDraft
  ) => void;

  onTimeChange: (
    time: number
  ) => void;

  onClose: () => void;

  onSave: () => void;
};

export function QuestionEditor({
  open,
  editing,
  draft,
  time,
  duration,
  onDraftChange,
  onTimeChange,
  onClose,
  onSave,
}: Props) {
  if (!open) {
    return null;
  }

  const isTrueFalse =
    draft.type ===
    "true-false";

  const isMultiple =
    draft.type ===
    "multiple";

  const isShortAnswer =
    draft.type ===
    "short-answer";

  const isMatching =
    draft.type ===
    "matching";

  const isOrdering =
    draft.type ===
    "ordering";

  const isClassification =
    draft.type ===
    "classification";

  function changeQuestionType(
    nextType: QuizType
  ) {
    if (
      nextType ===
      draft.type
    ) {
      return;
    }

    if (
      nextType ===
      "classification"
    ) {
      onDraftChange({
        ...draft,

        type:
          "classification",

        options: [
          "",
          "",
          "",
          "",
        ],

        correctIndex: 0,

        correctIndexes: [
          0,
        ],

        acceptedAnswers: [
          "",
        ],

        classificationCategories:
          draft.classificationCategories.length >= 2
            ? [
                draft.classificationCategories[0] ?? "",
                draft.classificationCategories[1] ?? "",
              ]
            : [
                "",
                "",
              ],

        classificationItems:
          draft.classificationItems.length > 0
            ? draft.classificationItems.map(
                (item) => ({
                  ...item,
                })
              )
            : [
                { text: "", categoryIndex: 0 },
                { text: "", categoryIndex: 0 },
                { text: "", categoryIndex: 1 },
                { text: "", categoryIndex: 1 },
                { text: "", categoryIndex: 0 },
                { text: "", categoryIndex: 1 },
              ],
      });

      return;
    }

    if (
      nextType ===
      "ordering"
    ) {
      onDraftChange({
        ...draft,

        type:
          "ordering",

        options: [
          "",
          "",
          "",
          "",
        ],

        correctIndex: 0,

        correctIndexes: [
          0,
        ],

        acceptedAnswers: [
          "",
        ],

        orderingItems:
          draft.orderingItems.length >
          0
            ? [
                ...draft.orderingItems,
              ]
            : [
                "",
                "",
                "",
                "",
              ],
      });

      return;
    }

    if (
      nextType ===
      "matching"
    ) {
      onDraftChange({
        ...draft,

        type:
          "matching",

        options: [
          "",
          "",
          "",
          "",
        ],

        correctIndex: 0,

        correctIndexes: [
          0,
        ],

        acceptedAnswers: [
          "",
        ],

        matchingPairs:
          draft.matchingPairs.length >
          0
            ? draft.matchingPairs.map(
                (pair) => ({
                  ...pair,
                })
              )
            : [
                { left: "", right: "" },
                { left: "", right: "" },
                { left: "", right: "" },
                { left: "", right: "" },
              ],
      });

      return;
    }

    if (
      nextType ===
      "short-answer"
    ) {
      const existingAnswers =
        draft.acceptedAnswers
          .map(
            (item) =>
              item
          );

      onDraftChange({
        ...draft,

        type:
          "short-answer",

        options: [
          "",
          "",
          "",
          "",
        ],

        correctIndex: 0,

        correctIndexes: [
          0,
        ],

        acceptedAnswers:
          existingAnswers.length >
          0
            ? existingAnswers
            : [
                "",
              ],
      });

      return;
    }

    if (
      nextType ===
      "true-false"
    ) {
      onDraftChange({
        ...draft,

        type:
          "true-false",

        options: [
          "Đúng",
          "Sai",
          "",
          "",
        ],

        correctIndex:
          draft.correctIndex ===
          1
            ? 1
            : 0,

        correctIndexes: [
          draft.correctIndex ===
          1
            ? 1
            : 0,
        ],
      });

      return;
    }

    if (
      nextType ===
      "multiple"
    ) {
      const fromTrueFalse =
        draft.type ===
        "true-false";

      const fromMatching =
        draft.type ===
        "matching";

      const fromOrdering =
        draft.type ===
        "ordering";

      const fromClassification =
        draft.type ===
        "classification";

      const nextOptions =
        fromTrueFalse ||
        fromMatching ||
        fromOrdering ||
        fromClassification
          ? [
              "",
              "",
              "",
              "",
            ] as [
              string,
              string,
              string,
              string
            ]
          : [
              ...draft.options,
            ] as [
              string,
              string,
              string,
              string
            ];

      const firstIndex =
        draft.correctIndexes[0] ??
        draft.correctIndex ??
        0;

      onDraftChange({
        ...draft,

        type:
          "multiple",

        options:
          nextOptions,

        correctIndex:
          firstIndex,

        correctIndexes: [
          firstIndex,
        ],
      });

      return;
    }

    const fromTrueFalse =
      draft.type ===
      "true-false";

    const fromMatching =
      draft.type ===
      "matching";

    const fromOrdering =
      draft.type ===
      "ordering";

    const fromClassification =
      draft.type ===
      "classification";

    const nextCorrectIndex =
      isMultiple
        ? draft.correctIndexes[0] ??
          0
        : draft.correctIndex;

    onDraftChange({
      ...draft,

      type:
        "multiple-choice",

      options:
        fromTrueFalse ||
        fromMatching ||
        fromOrdering ||
        fromClassification
          ? [
              "",
              "",
              "",
              "",
            ]
          : [
              ...draft.options,
            ],

      correctIndex:
        nextCorrectIndex,

      correctIndexes: [
        nextCorrectIndex,
      ],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-blue-600 bg-[#15376b] text-white shadow-2xl">

        {/* =================================================
            HEADER - LUÔN CỐ ĐỊNH
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-blue-700 px-6 py-5">

          <div>

            <h2 className="text-2xl font-bold">

              {editing
                ? "Chỉnh sửa câu hỏi"
                : isTrueFalse
                  ? "Thêm câu hỏi Đúng / Sai"
                  : isMultiple
                    ? "Thêm câu hỏi nhiều đáp án"
                    : isShortAnswer
                      ? "Thêm câu hỏi trả lời ngắn"
                      : isMatching
                        ? "Thêm câu hỏi ghép đôi"
                        : isOrdering
                          ? "Thêm câu hỏi sắp xếp thứ tự"
                          : isClassification
                            ? "Thêm câu hỏi phân loại"
                            : "Thêm câu hỏi trắc nghiệm"}

            </h2>

            <p className="mt-1 text-sm text-cyan-300">

              Xuất hiện tại{" "}

              <strong>
                {formatTime(time)}
              </strong>

            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-blue-900 hover:text-white"
            title="Đóng"
          >
            <X size={24} />
          </button>

        </div>

        {/* =================================================
            BODY - PHẦN NÀY CUỘN
        ================================================= */}

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">

          {/* =================================================
              LOẠI CÂU HỎI
          ================================================= */}

          <div>

            <label className="mb-3 block text-base font-bold">
              Loại câu hỏi
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "multiple-choice"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  draft.type ===
                  "multiple-choice"
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Trắc nghiệm
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  4 phương án và 1 đáp án đúng.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "true-false"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  isTrueFalse
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Đúng / Sai
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  Chọn Đúng hoặc Sai.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "multiple"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  isMultiple
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Nhiều đáp án
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  4 phương án và từ 2 đáp án đúng trở lên.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "short-answer"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  isShortAnswer
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Trả lời ngắn
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  Người học nhập câu trả lời bằng văn bản.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "matching"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  isMatching
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Ghép đôi
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  Ghép đúng các nội dung ở cột trái và cột phải.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "ordering"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  isOrdering
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Sắp xếp thứ tự
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  Sắp xếp các bước hoặc sự kiện theo đúng trình tự.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeQuestionType(
                    "classification"
                  )
                }
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  isClassification
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                    : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                }`}
              >
                <div className="font-bold">
                  Phân loại kéo thả
                </div>

                <div className="mt-1 text-xs text-slate-300">
                  Kéo các thẻ vào đúng một trong hai nhóm.
                </div>
              </button>

            </div>

          </div>

          {/* NỘI DUNG CÂU HỎI */}

          <div>

            <label className="mb-2 block text-base font-bold">
              Nội dung câu hỏi
            </label>

            <textarea
              value={draft.question}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  question:
                    e.target.value,
                })
              }
              className="min-h-28 w-full resize-y rounded-xl border border-blue-500 bg-[#07182c] p-4 text-lg text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder={
                isTrueFalse
                  ? "Ví dụ: Nước sôi ở 100°C trong điều kiện áp suất tiêu chuẩn."
                  : isMultiple
                    ? "Ví dụ: Những thiết bị nào là thiết bị đầu vào?"
                    : isShortAnswer
                      ? "Ví dụ: Thủ đô của Việt Nam là gì?"
                      : isMatching
                        ? "Ví dụ: Ghép quốc gia với thủ đô tương ứng."
                        : isOrdering
                          ? "Ví dụ: Sắp xếp đúng các bước khởi động máy tính."
                          : isClassification
                            ? "Ví dụ: Phân loại các thiết bị thành Thiết bị vào và Thiết bị ra."
                            : "Ví dụ: Thiết bị nào có chức năng bảo vệ quá tải?"
              }
            />

          </div>

          {/* =================================================
              ĐÁP ÁN
          ================================================= */}

          <div>

            <label className="mb-4 block text-base font-bold">
              Đáp án
            </label>

            {isClassification ? (

              <div className="space-y-5">

                <div className="rounded-xl border border-cyan-800 bg-cyan-950/30 p-4 text-sm text-cyan-100">
                  V12.0F dùng <strong>2 nhóm</strong> để đảm bảo hoạt động ổn định trên Editor, Preview và SCORM 1.2. Người học có thể kéo thả hoặc bấm nút để phân loại.
                </div>

                <div>
                  <div className="mb-3 text-sm font-bold text-slate-200">Tên hai nhóm</div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[0, 1].map(
                      (categoryIndex) => (
                        <input
                          key={categoryIndex}
                          value={
                            draft.classificationCategories[
                              categoryIndex
                            ] ?? ""
                          }
                          onChange={(e) => {
                            const nextCategories = [
                              ...(draft.classificationCategories ?? []),
                            ];

                            nextCategories[categoryIndex] =
                              e.target.value;

                            onDraftChange({
                              ...draft,
                              classificationCategories:
                                nextCategories,
                            });
                          }}
                          className="min-w-0 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                          placeholder={`Nhóm ${categoryIndex + 1}`}
                        />
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-sm font-bold text-slate-200">Các thẻ cần phân loại</div>

                  <div className="space-y-3">
                    {draft.classificationItems.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="grid gap-3 rounded-xl border border-blue-700 bg-blue-950/30 p-3 sm:grid-cols-[44px_minmax(0,1fr)_180px] sm:items-center"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/60 font-bold text-cyan-300">
                            {index + 1}
                          </div>

                          <input
                            value={item.text}
                            onChange={(e) => {
                              const nextItems =
                                draft.classificationItems.map(
                                  (current, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...current,
                                          text: e.target.value,
                                        }
                                      : current
                                );

                              onDraftChange({
                                ...draft,
                                classificationItems:
                                  nextItems,
                              });
                            }}
                            className="min-w-0 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                            placeholder={`Nội dung thẻ ${index + 1}`}
                          />

                          <select
                            value={item.categoryIndex}
                            onChange={(e) => {
                              const nextItems =
                                draft.classificationItems.map(
                                  (current, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...current,
                                          categoryIndex:
                                            Number(
                                              e.target.value
                                            ) === 1
                                              ? 1
                                              : 0,
                                        }
                                      : current
                                );

                              onDraftChange({
                                ...draft,
                                classificationItems:
                                  nextItems,
                              });
                            }}
                            className="rounded-xl border border-blue-500 bg-[#07182c] px-3 py-3 text-white outline-none focus:border-cyan-400"
                          >
                            <option value={0}>
                              {draft.classificationCategories[0]?.trim() || "Nhóm 1"}
                            </option>
                            <option value={1}>
                              {draft.classificationCategories[1]?.trim() || "Nhóm 2"}
                            </option>
                          </select>
                        </div>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-sm text-slate-300">
                    Nhập ít nhất 2 thẻ và cần có ít nhất 1 thẻ thuộc mỗi nhóm. Có thể để trống các dòng cuối.
                  </p>
                </div>

              </div>

            ) : isOrdering ? (

              <div className="space-y-4">

                <div className="rounded-xl border border-cyan-800 bg-cyan-950/30 p-4 text-sm text-cyan-100">
                  Nhập các nội dung theo <strong>thứ tự đúng</strong>. Khi làm bài, hệ thống sẽ đảo thứ tự để người học sắp xếp lại.
                </div>

                {draft.orderingItems.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-950/60 font-bold text-cyan-300">
                        {index + 1}
                      </div>

                      <input
                        value={item}
                        onChange={(e) => {
                          const nextItems =
                            [
                              ...draft.orderingItems,
                            ];

                          nextItems[index] =
                            e.target.value;

                          onDraftChange({
                            ...draft,
                            orderingItems:
                              nextItems,
                          });
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder={`Bước ${index + 1}`}
                      />
                    </div>
                  )
                )}

                <p className="text-sm text-slate-300">
                  Cần ít nhất 2 bước. Có thể để trống các dòng cuối nếu câu hỏi có ít hơn 4 bước.
                </p>

              </div>

            ) : isMatching ? (

              <div className="space-y-4">

                <div className="grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <div>#</div>
                  <div>Cột trái</div>
                  <div>Cột phải</div>
                </div>

                {draft.matchingPairs.map(
                  (pair, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/60 font-bold text-cyan-300">
                        {index + 1}
                      </div>

                      <input
                        value={pair.left}
                        onChange={(e) => {
                          const nextPairs =
                            draft.matchingPairs.map(
                              (item, pairIndex) =>
                                pairIndex === index
                                  ? {
                                      ...item,
                                      left: e.target.value,
                                    }
                                  : item
                            );

                          onDraftChange({
                            ...draft,
                            matchingPairs:
                              nextPairs,
                          });
                        }}
                        className="min-w-0 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder={`Nội dung trái ${index + 1}`}
                      />

                      <input
                        value={pair.right}
                        onChange={(e) => {
                          const nextPairs =
                            draft.matchingPairs.map(
                              (item, pairIndex) =>
                                pairIndex === index
                                  ? {
                                      ...item,
                                      right: e.target.value,
                                    }
                                  : item
                            );

                          onDraftChange({
                            ...draft,
                            matchingPairs:
                              nextPairs,
                          });
                        }}
                        className="min-w-0 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder={`Nội dung phải ${index + 1}`}
                      />
                    </div>
                  )
                )}

                <p className="text-sm text-slate-300">
                  Nhập ít nhất 2 cặp hoàn chỉnh. Khi làm bài, cột phải sẽ được đảo thứ tự để người học chọn ghép đúng.
                </p>

              </div>

            ) : isShortAnswer ? (

              <div className="space-y-3">

                {draft.acceptedAnswers.map(
                  (
                    answer,
                    index
                  ) => (

                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >

                      <div className="w-8 shrink-0 text-center text-sm font-bold text-cyan-300">
                        {index + 1}
                      </div>

                      <input
                        value={answer}
                        onChange={(e) => {
                          const nextAnswers =
                            [
                              ...draft.acceptedAnswers,
                            ];

                          nextAnswers[index] =
                            e.target.value;

                          onDraftChange({
                            ...draft,
                            acceptedAnswers:
                              nextAnswers,
                          });
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-4 text-lg text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder={
                          index === 0
                            ? "Ví dụ: Hà Nội"
                            : "Đáp án chấp nhận khác, ví dụ: Ha Noi"
                        }
                      />

                      <button
                        type="button"
                        disabled={
                          draft.acceptedAnswers.length <=
                          1
                        }
                        onClick={() =>
                          onDraftChange({
                            ...draft,
                            acceptedAnswers:
                              draft.acceptedAnswers.filter(
                                (
                                  _,
                                  answerIndex
                                ) =>
                                  answerIndex !==
                                  index
                              ),
                          })
                        }
                        className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-3 text-sm font-bold text-red-300 transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Xóa
                      </button>

                    </div>

                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    onDraftChange({
                      ...draft,
                      acceptedAnswers: [
                        ...draft.acceptedAnswers,
                        "",
                      ],
                    })
                  }
                  className="rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-900"
                >
                  + Thêm đáp án chấp nhận
                </button>

                <p className="text-sm text-slate-300">
                  Hệ thống không phân biệt chữ hoa/chữ thường và tự bỏ khoảng trắng thừa ở đầu, cuối câu trả lời.
                </p>

              </div>

            ) : isTrueFalse ? (

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {[
                  "Đúng",
                  "Sai",
                ].map(
                  (
                    option,
                    index
                  ) => (

                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-5 transition ${
                        draft.correctIndex ===
                        index
                          ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400"
                          : "border-blue-600 bg-[#07182c] hover:border-blue-400"
                      }`}
                    >

                      <input
                        type="radio"
                        name="correct-answer"
                        checked={
                          draft.correctIndex ===
                          index
                        }
                        onChange={() =>
                          onDraftChange({
                            ...draft,

                            options: [
                              "Đúng",
                              "Sai",
                              "",
                              "",
                            ],

                            correctIndex:
                              index,

                            correctIndexes: [
                              index,
                            ],
                          })
                        }
                        className="h-6 w-6 shrink-0 cursor-pointer accent-cyan-500"
                      />

                      <span className="text-lg font-bold">
                        {option}
                      </span>

                    </label>

                  )
                )}

              </div>

            ) : (

              <div className="space-y-4">

                {draft.options.map(
                  (
                    option,
                    index
                  ) => (

                    <div
                      key={index}
                      className="flex items-center gap-4"
                    >

                      {/* CHỌN ĐÁP ÁN ĐÚNG */}

                      <input
                        type={
                          isMultiple
                            ? "checkbox"
                            : "radio"
                        }
                        name={
                          isMultiple
                            ? undefined
                            : "correct-answer"
                        }
                        checked={
                          isMultiple
                            ? draft.correctIndexes.includes(
                                index
                              )
                            : draft.correctIndex ===
                              index
                        }
                        onChange={() => {
                          if (isMultiple) {
                            const checked =
                              draft.correctIndexes.includes(
                                index
                              );

                            const nextIndexes =
                              checked
                                ? draft.correctIndexes.filter(
                                    (item) =>
                                      item !==
                                      index
                                  )
                                : [
                                    ...draft.correctIndexes,
                                    index,
                                  ].sort(
                                    (a, b) =>
                                      a - b
                                  );

                            onDraftChange({
                              ...draft,

                              correctIndexes:
                                nextIndexes,

                              correctIndex:
                                nextIndexes[0] ??
                                0,
                            });

                            return;
                          }

                          onDraftChange({
                            ...draft,

                            correctIndex:
                              index,

                            correctIndexes: [
                              index,
                            ],
                          });
                        }}
                        className="h-6 w-6 shrink-0 cursor-pointer accent-cyan-500"
                      />

                      {/* A / B / C / D */}

                      <div className="w-7 shrink-0 text-lg font-bold text-cyan-300">

                        {String.fromCharCode(
                          65 + index
                        )}

                      </div>

                      {/* NỘI DUNG ĐÁP ÁN */}

                      <input
                        value={option}
                        onChange={(e) => {
                          const newOptions =
                            [
                              ...draft.options,
                            ] as [
                              string,
                              string,
                              string,
                              string
                            ];

                          newOptions[index] =
                            e.target.value;

                          onDraftChange({
                            ...draft,
                            options:
                              newOptions,
                          });
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-blue-500 bg-[#07182c] px-4 py-4 text-lg text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder={`Nhập đáp án ${String.fromCharCode(
                          65 + index
                        )}`}
                      />

                    </div>

                  )
                )}

              </div>

            )}

            <p className="mt-3 text-sm text-slate-300">

              {isTrueFalse
                ? "Chọn Đúng hoặc Sai làm đáp án chính xác."
                : isMultiple
                  ? "Đánh dấu ít nhất 2 đáp án đúng. Người học phải chọn đúng toàn bộ và không chọn thừa."
                  : "Chọn nút tròn bên trái để xác định đáp án đúng."}

            </p>

          </div>

          {/* =================================================
              THỜI ĐIỂM + ĐIỂM
          ================================================= */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* THỜI ĐIỂM */}

            <div>

              <label className="mb-2 block text-base font-bold">
                Thời điểm xuất hiện
              </label>

              <div className="flex items-center gap-3">

                <input
                  type="number"
                  min={0}
                  max={
                    duration > 0
                      ? duration
                      : undefined
                  }
                  step={0.1}
                  value={time}
                  onChange={(e) => {
                    const rawValue =
                      Number(
                        e.target.value
                      );

                    const safeValue =
                      Number.isFinite(
                        rawValue
                      )
                        ? rawValue
                        : 0;

                    const nextValue =
                      duration > 0
                        ? Math.min(
                            duration,
                            Math.max(
                              0,
                              safeValue
                            )
                          )
                        : Math.max(
                            0,
                            safeValue
                          );

                    onTimeChange(
                      nextValue
                    );
                  }}
                  className="w-full rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-lg outline-none focus:border-cyan-400"
                />

                <span className="shrink-0 text-sm text-slate-300">
                  giây
                </span>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Câu hỏi sẽ xuất hiện tại thời điểm này trong video.
              </p>

            </div>

            {/* ĐIỂM */}

            <div>

              <label className="mb-2 block text-base font-bold">
                Điểm
              </label>

              <input
                type="number"
                min={1}
                max={1000}
                value={draft.points}
                onChange={(e) => {
                  const value =
                    Number(
                      e.target.value
                    );

                  onDraftChange({
                    ...draft,

                    points:
                      Math.max(
                        1,
                        Number.isFinite(
                          value
                        )
                          ? value
                          : 1
                      ),
                  });
                }}
                className="w-full rounded-xl border border-blue-500 bg-[#07182c] px-4 py-3 text-lg outline-none focus:border-cyan-400"
              />

              <p className="mt-2 text-xs text-slate-400">
                Điểm cộng khi người học trả lời đúng.
              </p>

            </div>

          </div>

          {/* =================================================
              FEEDBACK
          ================================================= */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* ĐÚNG */}

            <div>

              <label className="mb-2 block text-base font-bold text-green-300">
                Feedback khi trả lời đúng
              </label>

              <textarea
                value={
                  draft.feedbackCorrect
                }
                onChange={(e) =>
                  onDraftChange({
                    ...draft,

                    feedbackCorrect:
                      e.target.value,
                  })
                }
                className="min-h-28 w-full resize-y rounded-xl border border-green-800 bg-[#07182c] p-4 text-white outline-none transition focus:border-green-400"
                placeholder="Ví dụ: Chính xác!"
              />

            </div>

            {/* SAI */}

            <div>

              <label className="mb-2 block text-base font-bold text-red-300">
                Feedback khi trả lời sai
              </label>

              <textarea
                value={
                  draft.feedbackWrong
                }
                onChange={(e) =>
                  onDraftChange({
                    ...draft,

                    feedbackWrong:
                      e.target.value,
                  })
                }
                className="min-h-28 w-full resize-y rounded-xl border border-red-900 bg-[#07182c] p-4 text-white outline-none transition focus:border-red-400"
                placeholder="Ví dụ: Chưa chính xác, hãy xem lại nội dung."
              />

            </div>

          </div>

          <div className="h-2" />

        </div>

        {/* =================================================
            FOOTER - LUÔN NHÌN THẤY
        ================================================= */}

        <div className="flex shrink-0 flex-col gap-3 border-t border-blue-700 bg-[#0d2850] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm text-slate-300">

            {editing
              ? "Đang chỉnh sửa câu hỏi"
              : isTrueFalse
                ? "Câu hỏi Đúng / Sai mới"
                : isMultiple
                  ? "Câu hỏi nhiều đáp án mới"
                  : "Câu hỏi trắc nghiệm mới"}

            {" • "}

            <span className="font-bold text-cyan-300">
              {formatTime(time)}
            </span>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-blue-600 bg-blue-950 px-6 py-3 font-semibold transition hover:bg-blue-900"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={onSave}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-7 py-3 font-bold shadow-lg transition hover:brightness-110"
            >

              <Save size={19} />

              {editing
                ? "Cập nhật câu hỏi"
                : "Lưu câu hỏi"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
