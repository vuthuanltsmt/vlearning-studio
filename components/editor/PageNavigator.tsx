"use client";

import {
  Copy,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";

import type {
  LessonPage,
} from "@/types/lesson";

type Props = {
  pages: LessonPage[];

  selectedPageId: string;

  onSelect: (
    pageId: string
  ) => void;

  onAdd: () => void;

  onRename: (
    pageId: string,
    title: string
  ) => void;

  onDuplicate: (
    pageId: string
  ) => void;

  onDelete: (
    pageId: string
  ) => void;
};

export function PageNavigator({
  pages,
  selectedPageId,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  function handleRename(
    page: LessonPage
  ) {
    const newTitle =
      window.prompt(
        "Nhập tên mới cho trang:",
        page.title
      );

    if (
      !newTitle ||
      !newTitle.trim()
    ) {
      return;
    }

    onRename(
      page.id,
      newTitle.trim()
    );
  }

  function handleDelete(
    page: LessonPage
  ) {
    const confirmed =
      window.confirm(
        `Bạn có chắc muốn xóa "${page.title}"?`
      );

    if (!confirmed) {
      return;
    }

    onDelete(
      page.id
    );
  }

  return (
    <aside className="w-[350px] shrink-0 overflow-y-auto border-r border-blue-900 bg-[#173f73] p-5 text-white">

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-lg font-bold">
            DANH SÁCH TRANG
          </div>

          <div className="mt-1 text-xs text-slate-300">
            {pages.length} trang
          </div>

        </div>

        {/* THÊM TRANG */}

        <button
          type="button"
          onClick={() => {
            onAdd();
          }}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold transition hover:bg-blue-500 active:scale-95"
        >
          <Plus
            size={16}
          />

          THÊM
        </button>

      </div>

      {/* DANH SÁCH */}

      <div className="space-y-3">

        {pages.map(
          (
            page,
            index
          ) => {
            const isSelected =
              page.id ===
              selectedPageId;

            return (
              <div
                key={
                  page.id
                }
                className={`rounded-xl border-2 p-4 transition ${
                  isSelected
                    ? "border-cyan-400 bg-blue-900/70"
                    : "border-transparent bg-blue-950/30 hover:bg-blue-900/40"
                }`}
              >

                {/* SELECT PAGE */}

                <button
                  type="button"
                  onClick={() =>
                    onSelect(
                      page.id
                    )
                  }
                  className="w-full text-left"
                >

                  <div className="flex items-start justify-between gap-3">

                    <strong className="min-w-0 truncate">
                      {index + 1}.{" "}
                      {page.title}
                    </strong>

                    <span className="shrink-0 text-xs text-cyan-300">

                      {
                        page
                          .quizzes
                          .length
                      }{" "}
                      câu hỏi

                    </span>

                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">

                    <div className="shrink-0 rounded-md bg-[#07182c] px-3 py-1 text-xs">

                      Trang tương tác

                    </div>

                    {page.videoName && (

                      <span className="min-w-0 truncate text-[11px] text-slate-300">

                        {page.videoName}

                      </span>

                    )}

                  </div>

                </button>

                {/* PAGE ACTIONS */}

                {isSelected && (

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-blue-700 pt-3">

                    {/* RENAME */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRename(
                          page
                        )
                      }
                      className="flex items-center justify-center gap-1 rounded-md bg-cyan-950 px-2 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-900"
                    >

                      <Edit3
                        size={13}
                      />

                      Tên

                    </button>

                    {/* DUPLICATE */}

                    <button
                      type="button"
                      onClick={() =>
                        onDuplicate(
                          page.id
                        )
                      }
                      className="flex items-center justify-center gap-1 rounded-md bg-purple-950 px-2 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-900"
                    >

                      <Copy
                        size={13}
                      />

                      Sao

                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          page
                        )
                      }
                      className="flex items-center justify-center gap-1 rounded-md bg-red-950 px-2 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900"
                    >

                      <Trash2
                        size={13}
                      />

                      Xóa

                    </button>

                  </div>

                )}

              </div>
            );
          }
        )}

      </div>

      {/* THÊM Ở CUỐI DANH SÁCH */}

      <button
        type="button"
        onClick={() => {
          onAdd();
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500 bg-blue-950/20 py-4 text-sm font-bold text-cyan-300 transition hover:bg-blue-900/50"
      >

        <Plus
          size={16}
        />

        Thêm trang mới

      </button>

    </aside>
  );
}