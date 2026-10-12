import type {
  ProjectDocument,
} from "@/types/lesson";

import type {
  CompletionSettings,
} from "@/lib/completionSettings";

import {
  loadCompletionSettingsForProject,
} from "@/lib/completionSettings";

export type RecoverySnapshot = {
  id: string;

  projectId: string;

  createdAt: string;

  label: string;

  project: ProjectDocument;

  completionSettings:
    CompletionSettings;
};

type HistoryMap = Record<
  string,
  RecoverySnapshot[]
>;

const HISTORY_STORAGE_KEY =
  "vlearning-studio-project-history-v1";

const ACTIVE_PROJECT_STORAGE_KEY =
  "vlearning-studio-project-v4";

const MAX_SNAPSHOTS =
  12;

/* =========================================================
   ID
========================================================= */

function createId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `history-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =========================================================
   CLEAN PROJECT
========================================================= */

function cleanProject(
  project: ProjectDocument
): ProjectDocument {
  return {
    ...project,

    pages:
      project.pages.map(
        (page) => ({
          ...page,

          /*
           * Blob URL chỉ tồn tại
           * trong phiên trình duyệt.
           */
          videoUrl:
            undefined,

          quizzes:
            page.quizzes.map(
              (quiz) => ({
                ...quiz,

                options:
                  [
                    ...quiz.options,
                  ],
              })
            ),
        })
      ),
  };
}

/* =========================================================
   SIGNATURE
========================================================= */

function createProjectSignature(
  project: ProjectDocument
) {
  return JSON.stringify(
    cleanProject(
      project
    )
  );
}

function createSnapshotSignature(
  snapshot:
    RecoverySnapshot
) {
  return JSON.stringify({
    project:
      cleanProject(
        snapshot.project
      ),

    completionSettings:
      snapshot.completionSettings,
  });
}

/* =========================================================
   READ HISTORY
========================================================= */

function readHistoryMap():
  HistoryMap {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(
        HISTORY_STORAGE_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(
        raw
      );

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(
        parsed
      )
    ) {
      return {};
    }

    return parsed as
      HistoryMap;
  } catch (
    error
  ) {
    console.error(
      "Không đọc được lịch sử dự án:",
      error
    );

    return {};
  }
}

/* =========================================================
   WRITE HISTORY
========================================================= */

function writeHistoryMap(
  map: HistoryMap
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(
      map
    )
  );
}

/* =========================================================
   PUSH SNAPSHOT
========================================================= */

function pushSnapshot(
  snapshot:
    RecoverySnapshot
) {
  const map =
    readHistoryMap();

  const current =
    Array.isArray(
      map[
        snapshot.projectId
      ]
    )
      ? map[
          snapshot.projectId
        ]
      : [];

  /*
   * Không lưu hai snapshot
   * liên tiếp giống hệt nhau.
   */
  const newest =
    current[0];

  if (
    newest &&
    createSnapshotSignature(
      newest
    ) ===
      createSnapshotSignature(
        snapshot
      )
  ) {
    return false;
  }

  map[
    snapshot.projectId
  ] = [
    snapshot,
    ...current,
  ].slice(
    0,
    MAX_SNAPSHOTS
  );

  writeHistoryMap(
    map
  );

  return true;
}

/* =========================================================
   BUILD SNAPSHOT
========================================================= */

function buildSnapshot(
  project:
    ProjectDocument,
  label:
    string
): RecoverySnapshot {
  return {
    id:
      createId(),

    projectId:
      project.id,

    createdAt:
      new Date().toISOString(),

    label:
      label.trim() ||
      "Phiên bản dự án",

    project:
      cleanProject(
        project
      ),

    completionSettings:
      loadCompletionSettingsForProject(
        project.id
      ),
  };
}

/* =========================================================
   GET PROJECT HISTORY
========================================================= */

export function getProjectHistory(
  projectId: string
): RecoverySnapshot[] {
  const map =
    readHistoryMap();

  const snapshots =
    map[
      projectId
    ];

  if (
    !Array.isArray(
      snapshots
    )
  ) {
    return [];
  }

  return [
    ...snapshots,
  ].sort(
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
  );
}

/* =========================================================
   SNAPSHOT PERSISTED VERSION BEFORE SAVE

   nextProject = project mới chuẩn bị được lưu.

   Hàm sẽ lấy project cũ hiện đang nằm
   trong localStorage và lưu nó vào History
   trước khi bị phiên bản mới ghi đè.
========================================================= */

export function capturePersistedVersionBeforeSave(
  nextProject:
    ProjectDocument,
  label:
    string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  try {
    const raw =
      window.localStorage.getItem(
        ACTIVE_PROJECT_STORAGE_KEY
      );

    if (!raw) {
      return false;
    }

    const persistedProject =
      JSON.parse(
        raw
      ) as ProjectDocument;

    if (
      !persistedProject?.id ||
      persistedProject.id !==
        nextProject.id
    ) {
      return false;
    }

    /*
     * Nếu persisted version và
     * version chuẩn bị lưu giống nhau
     * thì không tạo snapshot.
     */
    if (
      createProjectSignature(
        persistedProject
      ) ===
      createProjectSignature(
        nextProject
      )
    ) {
      return false;
    }

    return pushSnapshot(
      buildSnapshot(
        persistedProject,
        label
      )
    );
  } catch (
    error
  ) {
    console.error(
      "Không tạo được Recovery Snapshot:",
      error
    );

    return false;
  }
}

/* =========================================================
   SNAPSHOT CURRENT PROJECT

   Dùng trước khi Restore để người dùng
   vẫn có đường quay lại trạng thái hiện tại.
========================================================= */

export function createCurrentRecoverySnapshot(
  project:
    ProjectDocument,
  label:
    string
) {
  return pushSnapshot(
    buildSnapshot(
      project,
      label
    )
  );
}

/* =========================================================
   DELETE ONE SNAPSHOT
========================================================= */

export function deleteRecoverySnapshot(
  projectId:
    string,
  snapshotId:
    string
) {
  const map =
    readHistoryMap();

  const snapshots =
    map[
      projectId
    ];

  if (
    !Array.isArray(
      snapshots
    )
  ) {
    return;
  }

  map[
    projectId
  ] =
    snapshots.filter(
      (
        snapshot
      ) =>
        snapshot.id !==
        snapshotId
    );

  if (
    map[
      projectId
    ].length ===
      0
  ) {
    delete map[
      projectId
    ];
  }

  writeHistoryMap(
    map
  );
}

/* =========================================================
   CLEAR PROJECT HISTORY
========================================================= */

export function clearProjectHistory(
  projectId: string
) {
  const map =
    readHistoryMap();

  delete map[
    projectId
  ];

  writeHistoryMap(
    map
  );
}