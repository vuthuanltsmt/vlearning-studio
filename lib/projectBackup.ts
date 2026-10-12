import JSZip from "jszip";

import type {
  ProjectDocument,
} from "@/types/lesson";

import {
  getVideo,
  saveVideo,
} from "@/lib/videoDb";

import {
  loadCompletionSettingsForProject,
  saveCompletionSettingsForProject,
} from "@/lib/completionSettings";

import {
  getProjectThumbnail,
  saveProjectThumbnail,
} from "@/lib/projectThumbnailDb";

import {
  getProjectLibrary,
  saveProjectToLibrary,
} from "@/lib/projectLibrary";

import {
  GAME_LIBRARY_KEY,
  GAME_LINKS_KEY,
} from "@/lib/pageGames";

import type {
  PageGame,
} from "@/lib/pageGames";

/* =========================================================
   TYPES
========================================================= */

type BackupMediaItem = {
  pageId: string;
  path: string;
  originalName: string;
  mimeType: string;
};

type BackupGameLink = {
  id: string;
  gameId: string;
  projectId: string;
  pageId: string;
  attachedAt: string;
};

type BackupGameLinkFile = {
  links: BackupGameLink[];
};

type BackupGameFile = {
  games: PageGame[];
};

type BackupManifest = {
  format: "vlearning-project-backup";
  version: 1 | 2;
  exportedAt: string;

  projectFile: string;
  completionSettingsFile: string;

  thumbnailFile:
    | string
    | null;

  gamesFile?:
    | string
    | null;

  gameLinksFile?:
    | string
    | null;

  media:
    BackupMediaItem[];
};

export type ExportBackupResult = {
  fileName: string;
  missingVideoPages: string[];
};

export type ImportBackupResult = {
  project: ProjectDocument;
  warnings: string[];
};

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

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =========================================================
   FILE NAME
========================================================= */

function safeFileName(
  value: string
) {
  const cleaned =
    value
      .trim()
      .replace(
        /[<>:"/\\|?*\u0000-\u001F]/g,
        "-"
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        ""
      );

  return (
    cleaned ||
    "vlearning-project"
  );
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

          videoUrl:
            undefined,

          quizzes:
            page.quizzes.map(
              (quiz) => ({
                ...quiz,

                options:
                  [...quiz.options],
              })
            ),
        })
      ),
  };
}

/* =========================================================
   THUMBNAIL EXTENSION
========================================================= */

function getImageExtension(
  mimeType: string
) {
  switch (
    mimeType.toLowerCase()
  ) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/gif":
      return "gif";

    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}

/* =========================================================
   UNIQUE IMPORT TITLE
========================================================= */

function createUniqueImportedTitle(
  sourceTitle: string
) {
  const entries =
    getProjectLibrary();

  const usedTitles =
    new Set(
      entries.map(
        (entry) =>
          entry.project.title
            .trim()
            .toLocaleLowerCase(
              "vi"
            )
      )
    );

  const baseTitle =
    sourceTitle.trim() ||
    "Bài giảng khôi phục";

  if (
    !usedTitles.has(
      baseTitle.toLocaleLowerCase(
        "vi"
      )
    )
  ) {
    return baseTitle;
  }

  const firstCandidate =
    `${baseTitle} - Khôi phục`;

  if (
    !usedTitles.has(
      firstCandidate.toLocaleLowerCase(
        "vi"
      )
    )
  ) {
    return firstCandidate;
  }

  let index =
    2;

  while (true) {
    const candidate =
      `${baseTitle} - Khôi phục ${index}`;

    if (
      !usedTitles.has(
        candidate.toLocaleLowerCase(
          "vi"
        )
      )
    ) {
      return candidate;
    }

    index +=
      1;
  }
}


/* =========================================================
   GAMES
========================================================= */

function readGameLibrary():
  PageGame[] {
  if (
    typeof window ===
      "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        GAME_LIBRARY_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch (
    error
  ) {
    console.error(
      "Không đọc được thư viện trò chơi:",
      error
    );

    return [];
  }
}

function writeGameLibrary(
  games: PageGame[]
) {
  if (
    typeof window ===
      "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    GAME_LIBRARY_KEY,
    JSON.stringify(
      games
    )
  );
}

function readGameLinks():
  BackupGameLink[] {
  if (
    typeof window ===
      "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        GAME_LINKS_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch (
    error
  ) {
    console.error(
      "Không đọc được liên kết trò chơi:",
      error
    );

    return [];
  }
}

function writeGameLinks(
  links: BackupGameLink[]
) {
  if (
    typeof window ===
      "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    GAME_LINKS_KEY,
    JSON.stringify(
      links
    )
  );
}

function cloneGameForBackup(
  game: PageGame
): PageGame {
  return {
    ...game,

    questions:
      game.questions.map(
        (question) => ({
          ...question,

          answers: [
            question.answers[0],
            question.answers[1],
            question.answers[2],
            question.answers[3],
          ],
        })
      ),
  };
}

/* =========================================================
   DOWNLOAD
========================================================= */

function downloadBlob(
  blob: Blob,
  fileName: string
) {
  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    fileName;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  window.setTimeout(
    () => {
      URL.revokeObjectURL(
        url
      );
    },
    1000
  );
}

/* =========================================================
   EXPORT PROJECT BACKUP
========================================================= */

export async function exportProjectBackup(
  sourceProject: ProjectDocument
): Promise<ExportBackupResult> {
  const project =
    cleanProject(
      sourceProject
    );

  const zip =
    new JSZip();

  const media:
    BackupMediaItem[] =
      [];

  const missingVideoPages:
    string[] =
      [];

  /* -------------------------
     PROJECT
  ------------------------- */

  zip.file(
    "project.json",
    JSON.stringify(
      project,
      null,
      2
    )
  );

  /* -------------------------
     COMPLETION SETTINGS
  ------------------------- */

  const completionSettings =
    loadCompletionSettingsForProject(
      project.id
    );

  zip.file(
    "completion-settings.json",
    JSON.stringify(
      completionSettings,
      null,
      2
    )
  );

  /* -------------------------
     VIDEOS
  ------------------------- */

  for (
    let index = 0;
    index <
    project.pages.length;
    index += 1
  ) {
    const page =
      project.pages[
        index
      ];

    try {
      const video =
        await getVideo(
          page.id
        );

      if (!video) {
        if (
          page.videoName
        ) {
          missingVideoPages.push(
            page.title
          );
        }

        continue;
      }

      const originalName =
        video.name ||
        page.videoName ||
        `video-${index + 1}.mp4`;

      const zipName =
        `${String(
          index + 1
        ).padStart(
          3,
          "0"
        )}-${safeFileName(
          originalName
        )}`;

      const path =
        `media/${zipName}`;

      zip.file(
        path,
        video
      );

      media.push({
        pageId:
          page.id,

        path,

        originalName,

        mimeType:
          video.type ||
          "application/octet-stream",
      });
    } catch (
      error
    ) {
      console.error(
        `Không sao lưu được video của ${page.title}:`,
        error
      );

      if (
        page.videoName &&
        !missingVideoPages.includes(
          page.title
        )
      ) {
        missingVideoPages.push(
          page.title
        );
      }
    }
  }

  /* -------------------------
     LINKED GAMES
  ------------------------- */

  let gamesFile:
    string | null =
      null;

  let gameLinksFile:
    string | null =
      null;

  try {
    const allLinks =
      readGameLinks();

    const projectLinks =
      allLinks.filter(
        (link) =>
          link.projectId ===
          project.id
      );

    const linkedGameIds =
      new Set(
        projectLinks.map(
          (link) =>
            link.gameId
        )
      );

    const linkedGames =
      readGameLibrary()
        .filter(
          (game) =>
            linkedGameIds.has(
              game.id
            )
        )
        .map(
          cloneGameForBackup
        );

    if (
      linkedGames.length >
      0
    ) {
      gamesFile =
        "games.json";

      zip.file(
        gamesFile,
        JSON.stringify(
          {
            games:
              linkedGames,
          } satisfies BackupGameFile,
          null,
          2
        )
      );
    }

    if (
      projectLinks.length >
      0
    ) {
      gameLinksFile =
        "game-links.json";

      zip.file(
        gameLinksFile,
        JSON.stringify(
          {
            links:
              projectLinks,
          } satisfies BackupGameLinkFile,
          null,
          2
        )
      );
    }
  } catch (
    error
  ) {
    console.error(
      "Không sao lưu được trò chơi đã gắn:",
      error
    );
  }

  /* -------------------------
     THUMBNAIL
  ------------------------- */

  let thumbnailFile:
    string | null =
      null;

  try {
    const thumbnail =
      await getProjectThumbnail(
        project.id
      );

    if (thumbnail) {
      const extension =
        getImageExtension(
          thumbnail.type
        );

      thumbnailFile =
        `thumbnail.${extension}`;

      zip.file(
        thumbnailFile,
        thumbnail
      );
    }
  } catch (
    error
  ) {
    console.error(
      "Không sao lưu được thumbnail:",
      error
    );
  }

  /* -------------------------
     MANIFEST
  ------------------------- */

  const manifest:
    BackupManifest = {
      format:
        "vlearning-project-backup",

      version:
        2,

      exportedAt:
        new Date().toISOString(),

      projectFile:
        "project.json",

      completionSettingsFile:
        "completion-settings.json",

      thumbnailFile,

      gamesFile,

      gameLinksFile,

      media,
    };

  zip.file(
    "vlearning-manifest.json",
    JSON.stringify(
      manifest,
      null,
      2
    )
  );

  /* -------------------------
     GENERATE ZIP
  ------------------------- */

  const blob =
    await zip.generateAsync({
      type:
        "blob",

      compression:
        "DEFLATE",

      compressionOptions: {
        level:
          6,
      },
    });

  const fileName =
    `${safeFileName(
      project.title
    )}.vlearning.zip`;

  downloadBlob(
    blob,
    fileName
  );

  return {
    fileName,
    missingVideoPages,
  };
}

/* =========================================================
   VALIDATE PROJECT
========================================================= */

function validateProject(
  value: unknown
): asserts value is ProjectDocument {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "project.json không hợp lệ."
    );
  }

  const project =
    value as Partial<ProjectDocument>;

  if (
    typeof project.id !==
      "string" ||
    typeof project.title !==
      "string" ||
    !Array.isArray(
      project.pages
    )
  ) {
    throw new Error(
      "Dữ liệu dự án không đúng định dạng."
    );
  }

  if (
    project.pages.length ===
    0
  ) {
    throw new Error(
      "Dự án không có trang nào."
    );
  }
}

/* =========================================================
   IMPORT PROJECT BACKUP
========================================================= */

export async function importProjectBackup(
  backupFile: File
): Promise<ImportBackupResult> {
  const zip =
    await JSZip.loadAsync(
      backupFile
    );

  /* -------------------------
     MANIFEST
  ------------------------- */

  const manifestEntry =
    zip.file(
      "vlearning-manifest.json"
    );

  if (
    !manifestEntry
  ) {
    throw new Error(
      "Không tìm thấy vlearning-manifest.json. Đây có thể không phải file backup của VLearning Studio."
    );
  }

  const manifestText =
    await manifestEntry.async(
      "string"
    );

  const manifest =
    JSON.parse(
      manifestText
    ) as BackupManifest;

  if (
    manifest.format !==
      "vlearning-project-backup" ||
    ![
      1,
      2,
    ].includes(
      manifest.version
    )
  ) {
    throw new Error(
      "Phiên bản file backup không được hỗ trợ."
    );
  }

  /* -------------------------
     PROJECT
  ------------------------- */

  const projectEntry =
    zip.file(
      manifest.projectFile
    );

  if (
    !projectEntry
  ) {
    throw new Error(
      "Không tìm thấy project.json trong file backup."
    );
  }

  const projectText =
    await projectEntry.async(
      "string"
    );

  const sourceProject =
    JSON.parse(
      projectText
    );

  validateProject(
    sourceProject
  );

  /* -------------------------
     CREATE NEW IDS
  ------------------------- */

  const newProjectId =
    createId();

  const pageIdMap =
    new Map<
      string,
      string
    >();

  sourceProject.pages.forEach(
    (page) => {
      pageIdMap.set(
        page.id,
        createId()
      );
    }
  );

  const importedPages =
    sourceProject.pages.map(
      (page) => {
        const newPageId =
          pageIdMap.get(
            page.id
          )!;

        return {
          ...page,

          id:
            newPageId,

          videoUrl:
            undefined,

          quizzes:
            page.quizzes.map(
              (quiz) => ({
                ...quiz,

                id:
                  createId(),

                options:
                  [...quiz.options],
              })
            ),
        };
      }
    );

  const importedProject:
    ProjectDocument = {
      ...sourceProject,

      id:
        newProjectId,

      title:
        createUniqueImportedTitle(
          sourceProject.title
        ),

      selectedPageId:
        pageIdMap.get(
          sourceProject.selectedPageId
        ) ??
        importedPages[0].id,

      pages:
        importedPages,
    };

  const warnings:
    string[] =
      [];

  /* -------------------------
     RESTORE VIDEOS
  ------------------------- */

  for (
    const mediaItem of
    manifest.media ?? []
  ) {
    const targetPageId =
      pageIdMap.get(
        mediaItem.pageId
      );

    if (!targetPageId) {
      warnings.push(
        `Không xác định được trang cho video ${mediaItem.originalName}.`
      );

      continue;
    }

    const zipVideo =
      zip.file(
        mediaItem.path
      );

    if (!zipVideo) {
      warnings.push(
        `Thiếu video: ${mediaItem.originalName}`
      );

      continue;
    }

    try {
      const blob =
        await zipVideo.async(
          "blob"
        );

      const videoFile =
        new File(
          [blob],
          mediaItem.originalName ||
            "video.mp4",
          {
            type:
              mediaItem.mimeType ||
              blob.type ||
              "application/octet-stream",
          }
        );

      await saveVideo(
        targetPageId,
        videoFile
      );

      /*
       * Bảo đảm metadata videoName
       * cũng đúng tên file.
       */
      const targetPage =
        importedProject.pages.find(
          (page) =>
            page.id ===
            targetPageId
        );

      if (
        targetPage &&
        !targetPage.videoName
      ) {
        targetPage.videoName =
          videoFile.name;
      }
    } catch (
      error
    ) {
      console.error(
        `Không khôi phục được ${mediaItem.originalName}:`,
        error
      );

      warnings.push(
        `Không khôi phục được video: ${mediaItem.originalName}`
      );
    }
  }

  /* -------------------------
     RESTORE COMPLETION SETTINGS
  ------------------------- */

  try {
    const settingsEntry =
      zip.file(
        manifest.completionSettingsFile
      );

    if (settingsEntry) {
      const settingsText =
        await settingsEntry.async(
          "string"
        );

      const settings =
        JSON.parse(
          settingsText
        );

      saveCompletionSettingsForProject(
        importedProject.id,
        settings
      );
    } else {
      warnings.push(
        "Không tìm thấy điều kiện hoàn thành trong file backup."
      );
    }
  } catch (
    error
  ) {
    console.error(
      "Không khôi phục được điều kiện hoàn thành:",
      error
    );

    warnings.push(
      "Không khôi phục được điều kiện hoàn thành."
    );
  }

  /* -------------------------
     RESTORE THUMBNAIL
  ------------------------- */

  if (
    manifest.thumbnailFile
  ) {
    try {
      const thumbnailEntry =
        zip.file(
          manifest.thumbnailFile
        );

      if (
        thumbnailEntry
      ) {
        const thumbnailBlob =
          await thumbnailEntry.async(
            "blob"
          );

        await saveProjectThumbnail(
          importedProject.id,
          thumbnailBlob
        );
      } else {
        warnings.push(
          "Không tìm thấy ảnh đại diện trong file backup."
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Không khôi phục được thumbnail:",
        error
      );

      warnings.push(
        "Không khôi phục được ảnh đại diện."
      );
    }
  }

  /* -------------------------
     RESTORE LINKED GAMES
  ------------------------- */

  if (
    manifest.version >=
      2 &&
    manifest.gamesFile &&
    manifest.gameLinksFile
  ) {
    try {
      const gamesEntry =
        zip.file(
          manifest.gamesFile
        );

      const linksEntry =
        zip.file(
          manifest.gameLinksFile
        );

      if (
        gamesEntry &&
        linksEntry
      ) {
        const gamesText =
          await gamesEntry.async(
            "string"
          );

        const linksText =
          await linksEntry.async(
            "string"
          );

        const gameFile =
          JSON.parse(
            gamesText
          ) as BackupGameFile;

        const linkFile =
          JSON.parse(
            linksText
          ) as BackupGameLinkFile;

        const sourceGames =
          Array.isArray(
            gameFile.games
          )
            ? gameFile.games
            : [];

        const sourceLinks =
          Array.isArray(
            linkFile.links
          )
            ? linkFile.links
            : [];

        const gameIdMap =
          new Map<
            string,
            string
          >();

        const importedGames:
          PageGame[] =
            sourceGames.map(
              (game) => {
                const newGameId =
                  createId();

                gameIdMap.set(
                  game.id,
                  newGameId
                );

                return {
                  ...cloneGameForBackup(
                    game
                  ),

                  id:
                    newGameId,

                  updatedAt:
                    new Date().toISOString(),

                  questions:
                    game.questions.map(
                      (question) => ({
                        ...question,

                        id:
                          createId(),

                        answers: [
                          question.answers[0],
                          question.answers[1],
                          question.answers[2],
                          question.answers[3],
                        ],
                      })
                    ),
                };
              }
            );

        if (
          importedGames.length >
          0
        ) {
          writeGameLibrary([
            ...importedGames,
            ...readGameLibrary(),
          ]);
        }

        const importedLinks:
          BackupGameLink[] =
            sourceLinks.flatMap(
              (link) => {
                const newGameId =
                  gameIdMap.get(
                    link.gameId
                  );

                const newPageId =
                  pageIdMap.get(
                    link.pageId
                  );

                if (
                  !newGameId ||
                  !newPageId
                ) {
                  return [];
                }

                return [
                  {
                    id:
                      createId(),

                    gameId:
                      newGameId,

                    projectId:
                      importedProject.id,

                    pageId:
                      newPageId,

                    attachedAt:
                      new Date().toISOString(),
                  },
                ];
              }
            );

        if (
          importedLinks.length >
          0
        ) {
          writeGameLinks([
            ...readGameLinks(),
            ...importedLinks,
          ]);
        }
      } else {
        warnings.push(
          "File backup có thông tin trò chơi nhưng thiếu games.json hoặc game-links.json."
        );
      }
    } catch (
      error
    ) {
      console.error(
        "Không khôi phục được trò chơi đã gắn:",
        error
      );

      warnings.push(
        "Không khôi phục được trò chơi đã gắn với bài giảng."
      );
    }
  }

  /* -------------------------
     SAVE PROJECT LAST
  ------------------------- */

  saveProjectToLibrary(
    importedProject
  );

  return {
    project:
      importedProject,

    warnings,
  };
}