"use client";

import {
  Clock3,
  FileQuestion,
  History,
  Layers3,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  clearProjectHistory,
  createCurrentRecoverySnapshot,
  deleteRecoverySnapshot,
  getProjectHistory,
} from "@/lib/projectHistory";

import type {
  RecoverySnapshot,
} from "@/lib/projectHistory";

import {
  setActiveProject,
} from "@/lib/projectLibrary";

import {
  saveCompletionSettings,
} from "@/lib/completionSettings";

import {
  logActivity,
} from "@/lib/activityLog";

import {
  useEditorStore,
} from "@/stores/editorStore";

type Props = {
  open: boolean;

  onClose: () => void;
};

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "vi-VN"
  );
}

/* =========================================================
   QUIZ COUNT
========================================================= */

function getQuizCount(
  snapshot:
    RecoverySnapshot
) {
  return snapshot.project.pages.reduce(
    (
      total,
      page
    ) =>
      total +
      page.quizzes.length,
    0
  );
}

/* =========================================================
   MODAL
========================================================= */

export function ProjectHistoryModal({
  open,
  onClose,
}: Props) {
  const project =
    useEditorStore(
      (
        state
      ) =>
        state.project
    );

  const [
    snapshots,
    setSnapshots,
  ] =
    useState<
      RecoverySnapshot[]
    >([]);

  /* =====================================================
     REFRESH
  ===================================================== */

  function refresh() {
    setSnapshots(
      getProjectHistory(
        project.id
      )
    );
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    refresh();
  }, [
    open,
    project.id,
  ]);

  /* =====================================================
     ESC
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event:
        KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  /* =====================================================
     RESTORE
  ===================================================== */

  function handleRestore(
    snapshot:
      RecoverySnapshot
  ) {
    const confirmed =
      window.confirm(
        [
          "Khôi phục phiên bản này?",
          "",
          `Thời điểm: ${formatDate(
            snapshot.createdAt
          )}`,
          `Phiên bản: ${snapshot.label}`,
          "",
          "Trạng thái hiện tại sẽ được lưu vào Recovery History trước khi khôi phục.",
        ].join(
          "\n"
        )
      );

    if (!confirmed) {
      return;
    }

    /*
     * Giữ lại trạng thái hiện tại
     * để có thể quay lại sau này.
     */
    createCurrentRecoverySnapshot(
      project,
      "Trước khi khôi phục phiên bản"
    );

    /*
     * Đặt project được chọn thành
     * active project.
     */
    setActiveProject(
      snapshot.project
    );

    /*
     * Khôi phục điều kiện hoàn thành.
     *
     * Vì setActiveProject đã chạy trước,
     * saveCompletionSettings sẽ lưu vào
     * đúng project ID.
     */
    saveCompletionSettings(
      snapshot.completionSettings
    );

    logActivity({
      type: "recovery_restore",
      projectId:
        snapshot.project.id,
      projectTitle:
        snapshot.project.title,
      message: `Đã khôi phục Recovery "${snapshot.label}" cho dự án "${snapshot.project.title}"`,
    });

    onClose();

    /*
     * Reload là cách an toàn nhất:
     * - Zustand hydrate lại project
     * - video được restore từ IndexedDB
     * - Undo/Redo history RAM được reset
     */
    window.location.reload();
  }

  /* =====================================================
     DELETE SNAPSHOT
  ===================================================== */

  function handleDelete(
    snapshot:
      RecoverySnapshot
  ) {
    const confirmed =
      window.confirm(
        `Xóa Recovery Snapshot lúc ${formatDate(
          snapshot.createdAt
        )}?`
      );

    if (!confirmed) {
      return;
    }

    deleteRecoverySnapshot(
      project.id,
      snapshot.id
    );

    refresh();
  }

  /* =====================================================
     CLEAR HISTORY
  ===================================================== */

  function handleClearAll() {
    if (
      snapshots.length ===
      0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          "Xóa toàn bộ lịch sử phiên bản của dự án này?",
          "",
          "Thao tác này không xóa dự án hiện tại.",
          "Không thể hoàn tác.",
        ].join(
          "\n"
        )
      );

    if (!confirmed) {
      return;
    }

    clearProjectHistory(
      project.id
    );

    refresh();
  }

  if (!open) {
    return null;
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">

      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-blue-800 bg-[#0b213f] text-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4 border-b border-blue-800 bg-[#123665] px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950 text-cyan-300">
              <History
                size={22}
              />
            </div>

            <div>

              <h2 className="text-xl font-black">
                Lịch sử phiên bản
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Tối đa 12 Recovery Snapshot gần nhất
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl p-2 text-slate-300 transition hover:bg-blue-900 hover:text-white"
            title="Đóng"
          >
            <X
              size={21}
            />
          </button>

        </div>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto p-6">

          {snapshots.length ===
          0 ? (

            <div className="rounded-2xl border border-dashed border-blue-700 bg-blue-950/30 p-10 text-center">

              <History
                size={42}
                className="mx-auto text-cyan-300"
              />

              <div className="mt-4 text-lg font-bold">
                Chưa có Recovery Snapshot
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Khi bạn chỉnh sửa và Auto Save, phiên bản trước đó sẽ được lưu tại đây.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {snapshots.map(
                (
                  snapshot,
                  index
                ) => {
                  const quizCount =
                    getQuizCount(
                      snapshot
                    );

                  return (
                    <div
                      key={
                        snapshot.id
                      }
                      className="rounded-2xl border border-blue-800 bg-[#102b52] p-5"
                    >

                      <div className="flex flex-wrap items-start justify-between gap-4">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-lg bg-cyan-950 px-2.5 py-1 text-xs font-bold text-cyan-300">
                              #{index + 1}
                            </span>

                            <span className="font-bold">
                              {snapshot.label}
                            </span>

                          </div>

                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">

                            <Clock3
                              size={15}
                            />

                            {formatDate(
                              snapshot.createdAt
                            )}

                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">

                            <div className="flex items-center gap-1.5 rounded-lg bg-blue-950/70 px-3 py-2 text-xs text-slate-300">
                              <Layers3
                                size={14}
                              />

                              {
                                snapshot.project.pages.length
                              }{" "}
                              trang
                            </div>

                            <div className="flex items-center gap-1.5 rounded-lg bg-blue-950/70 px-3 py-2 text-xs text-slate-300">
                              <FileQuestion
                                size={14}
                              />

                              {
                                quizCount
                              }{" "}
                              câu hỏi
                            </div>

                            <div className="rounded-lg bg-blue-950/70 px-3 py-2 text-xs text-slate-300">
                              Điểm đạt{" "}
                              {
                                snapshot.completionSettings.passScorePercent
                              }
                              %
                            </div>

                            <div className="rounded-lg bg-blue-950/70 px-3 py-2 text-xs text-slate-300">
                              Xem video{" "}
                              {
                                snapshot.completionSettings.minWatchPercent
                              }
                              %
                            </div>

                          </div>

                        </div>

                        <div className="flex shrink-0 gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleRestore(
                                snapshot
                              )
                            }
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold transition hover:bg-emerald-500"
                          >
                            <RotateCcw
                              size={16}
                            />

                            Khôi phục
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                snapshot
                              )
                            }
                            className="flex items-center justify-center rounded-xl border border-red-800 bg-red-950/50 px-3 text-red-300 transition hover:bg-red-900"
                            title="Xóa phiên bản"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-between gap-4 border-t border-blue-800 bg-[#0d294e] px-6 py-4">

          <div className="text-xs text-slate-400">
            {snapshots.length} / 12 phiên bản
          </div>

          <div className="flex gap-2">

            {snapshots.length >
              0 && (

              <button
                type="button"
                onClick={
                  handleClearAll
                }
                className="rounded-xl border border-red-800 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-950"
              >
                Xóa toàn bộ lịch sử
              </button>

            )}

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold transition hover:bg-blue-500"
            >
              Đóng
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}