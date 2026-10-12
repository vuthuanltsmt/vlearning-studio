export type ActivityType =
  | "create_project"
  | "open_project"
  | "rename_project"
  | "duplicate_project"
  | "delete_project"
  | "add_page"
  | "add_quiz"
  | "backup_project"
  | "restore_project"
  | "export_scorm"
  | "recovery_restore"
  | "other";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  message: string;
  projectId?: string;
  projectTitle?: string;
  createdAt: string;
};

export type NewActivityEntry = {
  type: ActivityType;
  message: string;
  projectId?: string;
  projectTitle?: string;
};

const STORAGE_KEY =
  "vlearning-studio-activity-log-v1";

const CHANGE_EVENT =
  "vlearning-activity-log-changed";

const MAX_ENTRIES = 100;

/* =========================================================
   HELPERS
========================================================= */

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `activity-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function readEntries(): ActivityEntry[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed.filter(
      (
        item
      ): item is ActivityEntry =>
        Boolean(
          item &&
            typeof item.id ===
              "string" &&
            typeof item.type ===
              "string" &&
            typeof item.message ===
              "string" &&
            typeof item.createdAt ===
              "string"
        )
    );
  } catch (
    error
  ) {
    console.error(
      "Không thể đọc Activity Log:",
      error
    );

    return [];
  }
}

function writeEntries(
  entries: ActivityEntry[]
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        entries.slice(
          0,
          MAX_ENTRIES
        )
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        CHANGE_EVENT
      )
    );
  } catch (
    error
  ) {
    console.error(
      "Không thể lưu Activity Log:",
      error
    );
  }
}

/* =========================================================
   PUBLIC API
========================================================= */

export function getActivityLog(
  limit = MAX_ENTRIES
): ActivityEntry[] {
  return readEntries()
    .sort(
      (
        a,
        b
      ) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    )
    .slice(
      0,
      limit
    );
}

export function logActivity(
  input: NewActivityEntry
): ActivityEntry {
  const entry: ActivityEntry = {
    id: createId(),
    type: input.type,
    message:
      input.message,
    projectId:
      input.projectId,
    projectTitle:
      input.projectTitle,
    createdAt:
      new Date().toISOString(),
  };

  const entries =
    readEntries();

  writeEntries([
    entry,
    ...entries,
  ]);

  return entry;
}

export function clearActivityLog() {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.removeItem(
      STORAGE_KEY
    );

    window.dispatchEvent(
      new CustomEvent(
        CHANGE_EVENT
      )
    );
  } catch (
    error
  ) {
    console.error(
      "Không thể xóa Activity Log:",
      error
    );
  }
}

export function getActivityLogChangeEventName() {
  return CHANGE_EVENT;
}