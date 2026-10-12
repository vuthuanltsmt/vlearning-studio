export type CompletionSettings = {
  passScorePercent: number;
  minWatchPercent: number;
  requireAllQuizzes: boolean;
};

export const DEFAULT_COMPLETION_SETTINGS: CompletionSettings = {
  passScorePercent: 80,
  minWatchPercent: 90,
  requireAllQuizzes: true,
};

/*
 * Key cũ của V8/V9.
 *
 * Giữ lại để tự động chuyển cấu hình cũ
 * sang dự án hiện tại.
 */
const LEGACY_STORAGE_KEY =
  "vlearning-studio-completion-settings-v1";

/*
 * Key mới:
 *
 * {
 *   "project-id-1": {...},
 *   "project-id-2": {...}
 * }
 */
const PROJECT_SETTINGS_STORAGE_KEY =
  "vlearning-studio-completion-settings-by-project-v2";

/*
 * Project đang mở hiện vẫn được editorStore
 * lưu tại key này.
 */
const ACTIVE_PROJECT_STORAGE_KEY =
  "vlearning-studio-project-v4";

export const COMPLETION_SETTINGS_CHANGED_EVENT =
  "vlearning-completion-settings-changed";

/* =========================================================
   HELPERS
========================================================= */

function clampPercent(
  value: unknown,
  fallback: number
) {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        numberValue
      )
    )
  );
}

function sanitizeSettings(
  value: Partial<CompletionSettings> | null | undefined
): CompletionSettings {
  return {
    passScorePercent:
      clampPercent(
        value?.passScorePercent,
        DEFAULT_COMPLETION_SETTINGS.passScorePercent
      ),

    minWatchPercent:
      clampPercent(
        value?.minWatchPercent,
        DEFAULT_COMPLETION_SETTINGS.minWatchPercent
      ),

    requireAllQuizzes:
      typeof value?.requireAllQuizzes ===
      "boolean"
        ? value.requireAllQuizzes
        : DEFAULT_COMPLETION_SETTINGS.requireAllQuizzes,
  };
}

/* =========================================================
   ACTIVE PROJECT ID
========================================================= */

function getActiveProjectId() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        ACTIVE_PROJECT_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const project =
      JSON.parse(raw);

    if (
      typeof project?.id ===
      "string" &&
      project.id.trim()
    ) {
      return project.id;
    }

    return null;
  } catch (
    error
  ) {
    console.error(
      "Không đọc được ID dự án hiện tại:",
      error
    );

    return null;
  }
}

/* =========================================================
   READ ALL PROJECT SETTINGS
========================================================= */

function readProjectSettingsMap(): Record<
  string,
  CompletionSettings
> {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(
        PROJECT_SETTINGS_STORAGE_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    const result: Record<
      string,
      CompletionSettings
    > = {};

    Object.entries(
      parsed
    ).forEach(
      ([projectId, settings]) => {
        if (
          !projectId
        ) {
          return;
        }

        result[
          projectId
        ] =
          sanitizeSettings(
            settings as Partial<CompletionSettings>
          );
      }
    );

    return result;
  } catch (
    error
  ) {
    console.error(
      "Không đọc được cấu hình hoàn thành theo dự án:",
      error
    );

    return {};
  }
}

/* =========================================================
   WRITE ALL PROJECT SETTINGS
========================================================= */

function writeProjectSettingsMap(
  value: Record<
    string,
    CompletionSettings
  >
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    PROJECT_SETTINGS_STORAGE_KEY,
    JSON.stringify(
      value
    )
  );
}

/* =========================================================
   LEGACY SETTINGS
========================================================= */

function loadLegacySettings():
  | CompletionSettings
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        LEGACY_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    return sanitizeSettings(
      JSON.parse(raw)
    );
  } catch (
    error
  ) {
    console.error(
      "Không đọc được cấu hình hoàn thành cũ:",
      error
    );

    return null;
  }
}

/* =========================================================
   LOAD FOR SPECIFIC PROJECT
========================================================= */

export function loadCompletionSettingsForProject(
  projectId: string
): CompletionSettings {
  if (
    typeof window ===
    "undefined"
  ) {
    return {
      ...DEFAULT_COMPLETION_SETTINGS,
    };
  }

  const map =
    readProjectSettingsMap();

  const existing =
    map[projectId];

  if (existing) {
    return sanitizeSettings(
      existing
    );
  }

  /*
   * Migration V8/V9:
   *
   * Nếu project đang hỏi chính là project hiện tại
   * và trước đây có cấu hình global,
   * chuyển cấu hình đó sang project này.
   */
  const activeProjectId =
    getActiveProjectId();

  if (
    activeProjectId ===
    projectId
  ) {
    const legacy =
      loadLegacySettings();

    if (legacy) {
      map[
        projectId
      ] =
        legacy;

      writeProjectSettingsMap(
        map
      );

      return legacy;
    }
  }

  return {
    ...DEFAULT_COMPLETION_SETTINGS,
  };
}

/* =========================================================
   LOAD ACTIVE PROJECT SETTINGS
========================================================= */

export function loadCompletionSettings(): CompletionSettings {
  const projectId =
    getActiveProjectId();

  if (!projectId) {
    return (
      loadLegacySettings() ?? {
        ...DEFAULT_COMPLETION_SETTINGS,
      }
    );
  }

  return loadCompletionSettingsForProject(
    projectId
  );
}

/* =========================================================
   SAVE FOR SPECIFIC PROJECT
========================================================= */

export function saveCompletionSettingsForProject(
  projectId: string,
  settings: CompletionSettings
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const clean =
    sanitizeSettings(
      settings
    );

  const map =
    readProjectSettingsMap();

  map[
    projectId
  ] =
    clean;

  writeProjectSettingsMap(
    map
  );
}

/* =========================================================
   SAVE ACTIVE PROJECT SETTINGS
========================================================= */

export function saveCompletionSettings(
  settings: CompletionSettings
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const clean =
    sanitizeSettings(
      settings
    );

  const projectId =
    getActiveProjectId();

  if (projectId) {
    saveCompletionSettingsForProject(
      projectId,
      clean
    );
  } else {
    /*
     * Fallback trong trường hợp hiếm khi chưa có
     * project active.
     */
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify(
        clean
      )
    );
  }

  /*
   * Giữ nguyên event để Editor/Preview
   * đang chạy tiếp tục nhận thay đổi.
   */
  window.dispatchEvent(
    new CustomEvent(
      COMPLETION_SETTINGS_CHANGED_EVENT,
      {
        detail:
          clean,
      }
    )
  );
}

/* =========================================================
   COPY SETTINGS
========================================================= */

export function copyCompletionSettingsForProject(
  sourceProjectId: string,
  targetProjectId: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const sourceSettings =
    loadCompletionSettingsForProject(
      sourceProjectId
    );

  saveCompletionSettingsForProject(
    targetProjectId,
    sourceSettings
  );
}

/* =========================================================
   DELETE SETTINGS
========================================================= */

export function deleteCompletionSettingsForProject(
  projectId: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const map =
    readProjectSettingsMap();

  if (
    !Object.prototype.hasOwnProperty.call(
      map,
      projectId
    )
  ) {
    return;
  }

  delete map[
    projectId
  ];

  writeProjectSettingsMap(
    map
  );
}