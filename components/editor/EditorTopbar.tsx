"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Download,
  Eye,
  FolderOpen,
  History,
  Loader2,
  Palette,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";

import {
  useEditorStore,
} from "@/stores/editorStore";

import {
  getVideo,
} from "@/lib/videoDb";

import {
  exportCurrentProjectAsScorm,
} from "@/lib/scormExport";

import {
  saveProjectToLibrary,
} from "@/lib/projectLibrary";

import {
  capturePersistedVersionBeforeSave,
} from "@/lib/projectHistory";

import {
  logActivity,
} from "@/lib/activityLog";

import {
  ProjectHistoryModal,
} from "@/components/editor/ProjectHistoryModal";

import {
  DesignModal,
} from "@/components/editor/DesignModal";

import type {
  ProjectDocument,
} from "@/types/lesson";

type Props = {
  title: string;
  saveStatus: string;
  score: number;
  onSave: () => void;
};

const AUTO_SAVE_DELAY_MS =
  1200;

/* =========================================================
   PROJECT SIGNATURE
========================================================= */

function createProjectSignature(
  project: ProjectDocument
) {
  return JSON.stringify({
    ...project,

    pages:
      project.pages.map(
        (page) => ({
          ...page,

          videoUrl:
            undefined,
        })
      ),
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export function EditorTopbar({
  title,
  saveStatus,
  score,
  onSave,
}: Props) {
  const [
    exporting,
    setExporting,
  ] =
    useState(false);

  const [
    historyOpen,
    setHistoryOpen,
  ] =
    useState(false);

  const [
    designOpen,
    setDesignOpen,
  ] =
    useState(false);

  const hydrated =
    useEditorStore(
      (state) =>
        state.hydrated
    );

  const project =
    useEditorStore(
      (state) =>
        state.project
    );

  const selectedPageId =
    useEditorStore(
      (state) =>
        state.project
          .selectedPageId
    );

  const selectedPage =
    useEditorStore(
      (state) =>
        state.project.pages.find(
          (page) =>
            page.id ===
            state.project
              .selectedPageId
        )
    );

  const canUndo =
    useEditorStore(
      (state) =>
        state.past.length >
        0
    );

  const canRedo =
    useEditorStore(
      (state) =>
        state.future.length >
        0
    );

  const undo =
    useEditorStore(
      (state) =>
        state.undo
    );

  const redo =
    useEditorStore(
      (state) =>
        state.redo
    );

  const autoSaveTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const lastSavedSignatureRef =
    useRef<string | null>(
      null
    );

  /* =====================================================
     RESTORE CURRENT PAGE VIDEO
  ===================================================== */

  useEffect(() => {
    if (
      !hydrated ||
      !selectedPageId ||
      !selectedPage
    ) {
      return;
    }

    if (
      selectedPage.videoUrl
    ) {
      return;
    }

    let cancelled =
      false;

    async function restoreVideo() {
      try {
        const file =
          await getVideo(
            selectedPageId
          );

        if (
          cancelled ||
          !file
        ) {
          return;
        }

        const url =
          URL.createObjectURL(
            file
          );

        if (cancelled) {
          URL.revokeObjectURL(
            url
          );

          return;
        }

        useEditorStore.setState(
          (state) => ({
            project: {
              ...state.project,

              pages:
                state.project.pages.map(
                  (page) =>
                    page.id ===
                    selectedPageId
                      ? {
                          ...page,

                          videoUrl:
                            url,

                          videoName:
                            page.videoName ||
                            file.name,
                        }
                      : page
                ),
            },
          })
        );
      } catch (
        error
      ) {
        console.error(
          "Không khôi phục được video:",
          error
        );
      }
    }

    void restoreVideo();

    return () => {
      cancelled =
        true;
    };
  }, [
    hydrated,
    selectedPageId,
    selectedPage?.videoUrl,
  ]);

  /* =====================================================
     AUTO SAVE HELPERS
  ===================================================== */

  function clearAutoSaveTimer() {
    if (
      autoSaveTimerRef.current
    ) {
      clearTimeout(
        autoSaveTimerRef.current
      );

      autoSaveTimerRef.current =
        null;
    }
  }

  function hasUnsavedChanges() {
    if (
      !hydrated ||
      lastSavedSignatureRef.current ===
        null
    ) {
      return false;
    }

    const latestProject =
      useEditorStore.getState()
        .project;

    return (
      createProjectSignature(
        latestProject
      ) !==
      lastSavedSignatureRef.current
    );
  }

  /* =====================================================
     SAVE NOW + RECOVERY SNAPSHOT
  ===================================================== */

  function saveNow(
    historyLabel =
      "Trước khi Auto Save"
  ) {
    clearAutoSaveTimer();

    try {
      const projectBeforeSave =
        useEditorStore.getState()
          .project;

      /*
       * V10.12:
       * Trước khi ghi đè phiên bản
       * đang nằm trong localStorage,
       * lưu phiên bản cũ vào History.
       *
       * Nếu không có thay đổi thật,
       * hàm tự bỏ qua.
       */
      capturePersistedVersionBeforeSave(
        projectBeforeSave,
        historyLabel
      );

      useEditorStore.setState({
        saveStatus:
          "Đang lưu...",
      });

      onSave();

      const latestProject =
        useEditorStore.getState()
          .project;

      saveProjectToLibrary(
        latestProject
      );

      lastSavedSignatureRef.current =
        createProjectSignature(
          latestProject
        );
    } catch (
      error
    ) {
      console.error(
        "Không thể lưu dự án:",
        error
      );

      useEditorStore.setState({
        saveStatus:
          "Lưu thất bại",
      });
    }
  }

  /* =====================================================
     AUTO SAVE
  ===================================================== */

  useEffect(() => {
    if (
      !hydrated
    ) {
      return;
    }

    const signature =
      createProjectSignature(
        project
      );

    if (
      lastSavedSignatureRef.current ===
      null
    ) {
      lastSavedSignatureRef.current =
        signature;

      return;
    }

    if (
      signature ===
      lastSavedSignatureRef.current
    ) {
      return;
    }

    clearAutoSaveTimer();

    useEditorStore.setState({
      saveStatus:
        "Có thay đổi chưa lưu",
    });

    autoSaveTimerRef.current =
      setTimeout(
        () => {
          saveNow(
            "Trước khi Auto Save"
          );
        },
        AUTO_SAVE_DELAY_MS
      );

    return () => {
      clearAutoSaveTimer();
    };
  }, [
    hydrated,
    project,
    onSave,
  ]);

  /* =====================================================
     BEFORE UNLOAD
  ===================================================== */

  useEffect(() => {
    if (
      !hydrated
    ) {
      return;
    }

    function handleBeforeUnload(
      event:
        BeforeUnloadEvent
    ) {
      if (
        !hasUnsavedChanges()
      ) {
        return;
      }

      event.preventDefault();

      event.returnValue =
        "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    hydrated,
  ]);

  /* =====================================================
     SAVE WHEN TAB HIDDEN
  ===================================================== */

  useEffect(() => {
    if (
      !hydrated
    ) {
      return;
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "hidden"
      ) {
        return;
      }

      if (
        !hasUnsavedChanges()
      ) {
        return;
      }

      saveNow(
        "Trước khi tab chuyển sang nền"
      );
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    hydrated,
    onSave,
  ]);

  /* =====================================================
     KEYBOARD UNDO / REDO
  ===================================================== */

  useEffect(() => {
    function handleKeyDown(
      event:
        KeyboardEvent
    ) {
      const target =
        event.target as
          | HTMLElement
          | null;

      const tagName =
        target?.tagName
          ?.toUpperCase();

      const isTyping =
        tagName ===
          "INPUT" ||
        tagName ===
          "TEXTAREA" ||
        tagName ===
          "SELECT" ||
        Boolean(
          target?.isContentEditable
        );

      if (
        isTyping
      ) {
        return;
      }

      const modifier =
        event.ctrlKey ||
        event.metaKey;

      if (
        !modifier
      ) {
        return;
      }

      const key =
        event.key.toLowerCase();

      if (
        key ===
        "z"
      ) {
        event.preventDefault();

        if (
          event.shiftKey
        ) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (
        key ===
        "y"
      ) {
        event.preventDefault();

        redo();
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
    undo,
    redo,
  ]);

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      clearAutoSaveTimer();
    };
  }, []);

  /* =====================================================
     PROJECT LIBRARY
  ===================================================== */

  function handleProjects() {
    saveNow(
      "Trước khi rời Editor"
    );

    window.location.href =
      "/projects";
  }

  /* =====================================================
     PREVIEW
  ===================================================== */

  function handlePreview() {
    saveNow(
      "Trước khi xem trước"
    );

    window.open(
      "/preview/demo",
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =====================================================
     HISTORY
  ===================================================== */

  function handleHistory() {
    /*
     * Nếu còn thay đổi chưa lưu,
     * lưu trước để History luôn
     * có phiên bản trước đó.
     */
    if (
      hasUnsavedChanges()
    ) {
      saveNow(
        "Trước khi mở lịch sử phiên bản"
      );
    }

    setHistoryOpen(
      true
    );
  }

  /* =====================================================
     MANUAL SAVE
  ===================================================== */

  function handleManualSave() {
    saveNow(
      "Trước khi lưu thủ công"
    );
  }

  /* =====================================================
     EXPORT SCORM
  ===================================================== */

  async function handleExport() {
    if (
      exporting
    ) {
      return;
    }

    setExporting(
      true
    );

    try {
      saveNow(
        "Trước khi xuất SCORM"
      );

      const result =
        await exportCurrentProjectAsScorm();

      const exportedProject =
        useEditorStore.getState()
          .project;

      logActivity({
        type: "export_scorm",
        projectId:
          exportedProject.id,
        projectTitle:
          exportedProject.title,
        message: `Đã xuất SCORM 1.2 cho dự án "${exportedProject.title}" (${result.fileName})`,
      });

      if (
        result.missingVideoPages.length >
        0
      ) {
        alert(
          [
            "Đã tạo gói SCORM 1.2.",
            "",
            `File: ${result.fileName}`,
            "",
            "CẢNH BÁO:",
            "Không tìm thấy file video của các trang:",
            "",
            ...result.missingVideoPages.map(
              (
                pageTitle
              ) =>
                `• ${pageTitle}`
            ),
            "",
            "Gói vẫn được xuất nhưng các trang trên sẽ không có video.",
          ].join(
            "\n"
          )
        );

        return;
      }

      alert(
        [
          "Xuất SCORM 1.2 thành công!",
          "",
          `File: ${result.fileName}`,
          "",
          "Bạn có thể tải file ZIP này lên Moodle hoặc LMS hỗ trợ SCORM 1.2.",
        ].join(
          "\n"
        )
      );
    } catch (
      error
    ) {
      console.error(
        "Xuất SCORM thất bại:",
        error
      );

      alert(
        error instanceof
          Error
          ? `Không thể xuất SCORM:\n${error.message}`
          : "Không thể xuất SCORM."
      );
    } finally {
      setExporting(
        false
      );
    }
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>

      <header className="flex h-[74px] shrink-0 items-center justify-between gap-4 border-b border-blue-800 bg-[#143766] px-5 text-white">

        {/* LEFT */}

        <div className="flex min-w-0 items-center gap-4">

          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-blue-900 hover:text-white"
            title="Quay lại"
          >
            <ArrowLeft
              size={22}
            />
          </button>

          <button
            type="button"
            onClick={
              handleProjects
            }
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold transition hover:bg-blue-500"
          >
            <FolderOpen
              size={19}
            />

            DỰ ÁN ĐÃ TẠO
          </button>

          <div className="min-w-0">

            <div className="truncate font-bold">
              {title}
            </div>

            <div className="mt-1 truncate text-xs text-cyan-300">
              {saveStatus}
            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex shrink-0 items-center gap-2">

          <div className="rounded-xl bg-blue-950/70 px-4 py-3 text-sm text-slate-300">

            Điểm{" "}

            <strong className="ml-1 text-lg text-cyan-300">
              {score}
            </strong>

          </div>

          {/* UNDO */}

          <button
            type="button"
            onClick={
              undo
            }
            disabled={
              !canUndo
            }
            title="Hoàn tác (Ctrl+Z)"
            aria-label="Hoàn tác"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-700 bg-blue-950/70 text-slate-200 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo2
              size={19}
            />
          </button>

          {/* REDO */}

          <button
            type="button"
            onClick={
              redo
            }
            disabled={
              !canRedo
            }
            title="Làm lại (Ctrl+Y hoặc Ctrl+Shift+Z)"
            aria-label="Làm lại"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-700 bg-blue-950/70 text-slate-200 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Redo2
              size={19}
            />
          </button>

          {/* HISTORY */}

          <button
            type="button"
            onClick={
              handleHistory
            }
            title="Lịch sử phiên bản"
            aria-label="Lịch sử phiên bản"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-700 bg-purple-950/60 text-purple-200 transition hover:bg-purple-900"
          >
            <History
              size={19}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              setDesignOpen(
                true
              )
            }
            className="flex items-center gap-2 rounded-xl border border-cyan-500 bg-cyan-950 px-4 py-3 font-bold text-white transition hover:bg-cyan-900"
          >
            <Palette
              size={18}
            />

            Thiết kế
          </button>

          <button
            type="button"
            onClick={
              handleManualSave
            }
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold transition hover:bg-emerald-500"
          >
            <Save
              size={18}
            />

            Lưu dự án
          </button>

          <button
            type="button"
            onClick={
              handlePreview
            }
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold transition hover:bg-blue-500"
          >
            <Eye
              size={18}
            />

            Xem trước
          </button>

          <button
            type="button"
            onClick={
              handleExport
            }
            disabled={
              exporting
            }
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 font-bold transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >

            {exporting ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Download
                size={18}
              />
            )}

            {exporting
              ? "Đang xuất..."
              : "Xuất file"}

          </button>

        </div>

      </header>

      <ProjectHistoryModal
        open={
          historyOpen
        }
        onClose={() =>
          setHistoryOpen(
            false
          )
        }
      />

      <DesignModal
        open={
          designOpen
        }
        projectId={
          project.id
        }
        projectTitle={
          project.title
        }
        onClose={() =>
          setDesignOpen(
            false
          )
        }
      />

    </>
  );
}