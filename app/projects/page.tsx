"use client";

import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  FileQuestion,
  FolderOpen,
  Gamepad2,
  ImageOff,
  ImagePlus,
  Layers3,
  Loader2,
  Menu,
  Pencil,
  RotateCcw,
  RefreshCw,
  Save,
  WandSparkles,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import LeftSidebar from "@/components/projects/LeftSidebar";

import {
  createNewProject,
  deleteProjectFromLibrary,
  duplicateProjectInLibrary,
  getProjectLibrary,
  getProjectQuizCount,
  renameProjectInLibrary,
  saveProjectToLibrary,
  setActiveProject,
  syncCurrentProjectToLibrary,
} from "@/lib/projectLibrary";

import {
  deleteProjectThumbnail,
  getProjectThumbnail,
  saveProjectThumbnail,
} from "@/lib/projectThumbnailDb";

import {
  exportProjectBackup,
  importProjectBackup,
} from "@/lib/projectBackup";

import {
  logActivity,
} from "@/lib/activityLog";

import {
  changeServerAccountPassword,
  deleteServerAccount,
  getServerSession,
  loginServerAccount,
  logoutServerAccount,
  registerServerAccount,
  updateServerAccountProfile,
  validateServerPassword,
} from "@/lib/authClient";

import type {
  ServerSessionUser,
} from "@/lib/authClient";

import type {
  ProjectLibraryEntry,
} from "@/lib/projectLibrary";

import AdminUsersPanel from "@/components/admin/UserAdminPanel";

import GuideCenter from "@/components/guide/GuideCenter";

import {
  SERVER_AUTH_EVENT,
} from "@/lib/authClient";

import {
  ACCESS_ROLE_LABELS,
  canAuthor,
  canManageUsers,
} from "@/lib/permissions";

import {
  getCloudProjectClient,
  getCloudStatusClient,
  listCloudProjectsClient,
  pushCloudProjectsClient,
} from "@/lib/cloudProjectsClient";

import type {
  CloudStatus,
} from "@/lib/cloudProjectsClient";

/* =========================================================
   TYPES
========================================================= */

type SortMode =
  | "updated-desc"
  | "updated-asc"
  | "title-asc"
  | "title-desc";

/* =========================================================
   DATE
========================================================= */

function formatUpdatedAt(
  value: string
) {
  const date =
    new Date(value);

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
   SEARCH
========================================================= */

function normalizeText(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /đ/g,
      "d"
    )
    .replace(
      /Đ/g,
      "D"
    )
    .toLowerCase()
    .trim();
}

/* =========================================================
   BLOB -> DATA URL
========================================================= */

function blobToDataUrl(
  blob: Blob
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result ===
            "string"
          ) {
            resolve(
              reader.result
            );
          } else {
            reject(
              new Error(
                "Không đọc được ảnh."
              )
            );
          }
        };

      reader.onerror =
        () => {
          reject(
            reader.error ??
              new Error(
                "Không đọc được ảnh."
              )
          );
        };

      reader.readAsDataURL(
        blob
      );
    }
  );
}

/* =========================================================
   PAGE
========================================================= */


type StudioSection =
  | "projects"
  | "guide"
  | "games"
  | "script"
  | "ai-settings"
  | "install"
  | "language"
  | "privacy"
  | "terms"
  | "account"
  | "admin-users";

type AiPreferences = {
  detail: "short" | "balanced" | "detailed";
  defaultDuration: number;
  includeActivities: boolean;
  includeAssessment: boolean;
};

const DEFAULT_AI_PREFERENCES: AiPreferences = {
  detail: "balanced",
  defaultDuration: 45,
  includeActivities: true,
  includeAssessment: true,
};

function WorkspaceHeader({
  title,
  description,
  onOpenMenu,
}: {
  title: string;
  description: string;
  onOpenMenu: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3 xl:hidden">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Mở menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300"
        >
          <Menu size={21} />
        </button>

        <div>
          <div className="text-lg font-black text-cyan-300">
            VLEARNING STUDIO
          </div>
          <div className="text-[10px] text-slate-400">
            {title}
          </div>
        </div>
      </div>

      <section className="rounded-[26px] border border-blue-700/40 bg-gradient-to-r from-[#103b68] via-[#153b6c] to-[#1d3264] px-7 py-8 shadow-[0_20px_65px_rgba(0,0,0,0.2)]">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
          VLearning Studio
        </div>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
          {description}
        </p>
      </section>
    </>
  );
}

function GuidePanel({
  onNavigate,
  onOpenMenu,
}: {
  onNavigate: (section: StudioSection) => void;
  onOpenMenu: () => void;
}) {
  return (
    <GuideCenter
      onNavigate={
        onNavigate
      }
      onOpenMenu={
        onOpenMenu
      }
    />
  );
}


type GameQuestion = {
  id: string;
  prompt: string;
  answers: [
    string,
    string,
    string,
    string,
  ];
  correct: number;
};

type GameSet = {
  id: string;
  title: string;
  description: string;
  questions: GameQuestion[];
  updatedAt: string;
};

type GameLink = {
  id: string;
  gameId: string;
  projectId: string;
  pageId: string;
  attachedAt: string;
};

const GAME_LIBRARY_KEY =
  "vlearning-game-library-v1";

const GAME_LINKS_KEY =
  "vlearning-project-game-links-v1";

function makeGameId(
  prefix: string
) {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }
}

function createBlankQuestion(): GameQuestion {
  return {
    id: makeGameId(
      "question"
    ),
    prompt: "",
    answers: [
      "",
      "",
      "",
      "",
    ],
    correct: 0,
  };
}

function createBlankGame(): GameSet {
  return {
    id: makeGameId(
      "game"
    ),
    title:
      "Trò chơi mới",
    description: "",
    questions: [
      createBlankQuestion(),
    ],
    updatedAt:
      new Date().toISOString(),
  };
}

function cloneGame(
  game: GameSet
): GameSet {
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

function normalizeGameLibrary(
  raw: unknown
): GameSet[] {
  if (
    !Array.isArray(
      raw
    )
  ) {
    return [];
  }

  return raw.flatMap(
    (entry) => {
      if (
        !entry ||
        typeof entry !==
          "object"
      ) {
        return [];
      }

      const source =
        entry as Partial<GameSet>;

      if (
        typeof source.id !==
          "string" ||
        typeof source.title !==
          "string" ||
        !Array.isArray(
          source.questions
        )
      ) {
        return [];
      }

      const questions =
        source.questions.flatMap(
          (question) => {
            if (
              !question ||
              typeof question !==
                "object"
            ) {
              return [];
            }

            const item =
              question as Partial<GameQuestion>;

            if (
              typeof item.id !==
                "string" ||
              typeof item.prompt !==
                "string" ||
              !Array.isArray(
                item.answers
              ) ||
              item.answers.length !==
                4
            ) {
              return [];
            }

            const answers =
              item.answers.map(
                (answer) =>
                  String(
                    answer ?? ""
                  )
              ) as [
                string,
                string,
                string,
                string,
              ];

            return [
              {
                id:
                  item.id,
                prompt:
                  item.prompt,
                answers,
                correct:
                  typeof item.correct ===
                    "number" &&
                  item.correct >=
                    0 &&
                  item.correct <
                    4
                    ? item.correct
                    : 0,
              },
            ];
          }
        );

      if (
        questions.length ===
        0
      ) {
        return [];
      }

      return [
        {
          id:
            source.id,
          title:
            source.title,
          description:
            typeof source.description ===
            "string"
              ? source.description
              : "",
          questions,
          updatedAt:
            typeof source.updatedAt ===
            "string"
              ? source.updatedAt
              : new Date().toISOString(),
        },
      ];
    }
  );
}


function normalizeGameLinks(
  raw: unknown
): GameLink[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap(
    (entry) => {
      if (
        !entry ||
        typeof entry !==
          "object"
      ) {
        return [];
      }

      const item =
        entry as Partial<GameLink>;

      if (
        typeof item.id !==
          "string" ||
        typeof item.gameId !==
          "string" ||
        typeof item.projectId !==
          "string" ||
        typeof item.pageId !==
          "string"
      ) {
        return [];
      }

      return [
        {
          id:
            item.id,
          gameId:
            item.gameId,
          projectId:
            item.projectId,
          pageId:
            item.pageId,
          attachedAt:
            typeof item.attachedAt ===
            "string"
              ? item.attachedAt
              : new Date().toISOString(),
        },
      ];
    }
  );
}

function GamePanel({
  onOpenMenu,
  projects:
    incomingProjects,
}: {
  onOpenMenu: () => void;
  projects: ProjectLibraryEntry[];
}) {
  const [
    games,
    setGames,
  ] =
    useState<GameSet[]>(
      []
    );

  const [
    gameLinks,
    setGameLinks,
  ] =
    useState<GameLink[]>(
      []
    );

  const [
    availableProjects,
    setAvailableProjects,
  ] =
    useState<ProjectLibraryEntry[]>(
      incomingProjects
    );

  const [
    attachProjectId,
    setAttachProjectId,
  ] =
    useState("");

  const [
    attachPageId,
    setAttachPageId,
  ] =
    useState("");

  const [
    draft,
    setDraft,
  ] =
    useState<GameSet>(
      createBlankGame
    );

  const [
    activeGameId,
    setActiveGameId,
  ] =
    useState<
      string | null
    >(null);

  const [
    mode,
    setMode,
  ] =
    useState<
      "builder" | "play"
    >("builder");

  const [
    current,
    setCurrent,
  ] =
    useState(0);

  const [
    score,
    setScore,
  ] =
    useState(0);

  const [
    selected,
    setSelected,
  ] =
    useState<
      number | null
    >(null);

  const [
    finished,
    setFinished,
  ] =
    useState(false);

  const [
    savedFlash,
    setSavedFlash,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          GAME_LIBRARY_KEY
        );

      if (
        !raw
      ) {
        return;
      }

      const parsed =
        normalizeGameLibrary(
          JSON.parse(
            raw
          )
        );

      setGames(
        parsed
      );

      if (
        parsed.length >
        0
      ) {
        setActiveGameId(
          parsed[0].id
        );
        setDraft(
          cloneGame(
            parsed[0]
          )
        );
      }

      const rawLinks =
        localStorage.getItem(
          GAME_LINKS_KEY
        );

      if (
        rawLinks
      ) {
        setGameLinks(
          normalizeGameLinks(
            JSON.parse(
              rawLinks
            )
          )
        );
      }
    } catch {
      // Start with an empty local game library when stored data is invalid.
    }
  }, []);

  function persistGames(
    next: GameSet[]
  ) {
    setGames(
      next
    );

    try {
      localStorage.setItem(
        GAME_LIBRARY_KEY,
        JSON.stringify(
          next
        )
      );
    } catch {
      window.alert(
        "Không thể lưu bộ trò chơi vào trình duyệt."
      );
    }
  }



  function reloadProjectsForGame(
    showMessage = false
  ) {
    syncCurrentProjectToLibrary();

    const nextProjects =
      getProjectLibrary();

    setAvailableProjects(
      nextProjects
    );

    if (
      showMessage
    ) {
      window.alert(
        nextProjects.length >
        0
          ? `Đã tìm thấy ${nextProjects.length} dự án.`
          : "Chưa tìm thấy dự án đã lưu. Hãy vào Dự án của tôi, mở hoặc tạo một dự án rồi quay lại."
      );
    }
  }

  useEffect(() => {
    reloadProjectsForGame(
      false
    );
  }, []);

  useEffect(() => {
    if (
      incomingProjects.length >
      0
    ) {
      setAvailableProjects(
        incomingProjects
      );
    }
  }, [
    incomingProjects,
  ]);

  function persistGameLinks(
    next: GameLink[]
  ) {
    setGameLinks(
      next
    );

    try {
      localStorage.setItem(
        GAME_LINKS_KEY,
        JSON.stringify(
          next
        )
      );
    } catch {
      window.alert(
        "Không thể lưu liên kết trò chơi với bài giảng."
      );
    }
  }

  useEffect(() => {
    if (
      availableProjects.length ===
      0
    ) {
      setAttachProjectId(
        ""
      );
      setAttachPageId(
        ""
      );
      return;
    }

    const currentProject =
      availableProjects.find(
        (entry) =>
          entry.project.id ===
          attachProjectId
      ) ??
      availableProjects[0];

    if (
      currentProject.project.id !==
      attachProjectId
    ) {
      setAttachProjectId(
        currentProject.project.id
      );
    }

    const pageExists =
      currentProject.project.pages.some(
        (pageItem) =>
          pageItem.id ===
          attachPageId
      );

    if (
      !pageExists
    ) {
      setAttachPageId(
        currentProject.project.pages[0]?.id ??
          ""
      );
    }
  }, [
    availableProjects,
    attachProjectId,
    attachPageId,
  ]);

  function attachCurrentGame() {
    if (
      !validateGame(
        draft
      )
    ) {
      return;
    }

    if (
      !attachProjectId ||
      !attachPageId
    ) {
      window.alert(
        "Hãy chọn dự án và trang muốn gắn trò chơi."
      );
      return;
    }

    const savedGame: GameSet =
      {
        ...cloneGame(
          draft
        ),
        title:
          draft.title.trim(),
        description:
          draft.description.trim(),
        updatedAt:
          new Date().toISOString(),
      };

    const exists =
      games.some(
        (game) =>
          game.id ===
          savedGame.id
      );

    const nextGames =
      exists
        ? games.map(
            (game) =>
              game.id ===
              savedGame.id
                ? savedGame
                : game
          )
        : [
            savedGame,
            ...games,
          ];

    persistGames(
      nextGames
    );

    setDraft(
      cloneGame(
        savedGame
      )
    );
    setActiveGameId(
      savedGame.id
    );

    const duplicate =
      gameLinks.some(
        (link) =>
          link.gameId ===
            savedGame.id &&
          link.projectId ===
            attachProjectId &&
          link.pageId ===
            attachPageId
      );

    if (
      duplicate
    ) {
      window.alert(
        "Trò chơi này đã được gắn vào trang đã chọn."
      );
      return;
    }

    persistGameLinks([
      ...gameLinks,
      {
        id:
          makeGameId(
            "game-link"
          ),
        gameId:
          savedGame.id,
        projectId:
          attachProjectId,
        pageId:
          attachPageId,
        attachedAt:
          new Date().toISOString(),
      },
    ]);

    window.alert(
      "Đã gắn trò chơi vào bài giảng."
    );
  }

  function detachGameLink(
    linkId: string
  ) {
    persistGameLinks(
      gameLinks.filter(
        (link) =>
          link.id !==
          linkId
      )
    );
  }

  function openLinkedProject(
    projectId: string
  ) {
    const entry =
      availableProjects.find(
        (item) =>
          item.project.id ===
          projectId
      );

    if (
      !entry
    ) {
      window.alert(
        "Không tìm thấy dự án đã liên kết."
      );
      return;
    }

    setActiveProject(
      entry.project
    );

    window.location.href =
      "/editor/demo";
  }

  function validateGame(
    game: GameSet,
    showMessage = true
  ) {
    if (
      !game.title.trim()
    ) {
      if (
        showMessage
      ) {
        window.alert(
          "Hãy nhập tên trò chơi."
        );
      }
      return false;
    }

    if (
      game.questions.length ===
      0
    ) {
      if (
        showMessage
      ) {
        window.alert(
          "Trò chơi cần ít nhất 1 câu hỏi."
        );
      }
      return false;
    }

    for (
      let index = 0;
      index <
      game.questions.length;
      index += 1
    ) {
      const question =
        game.questions[
          index
        ];

      if (
        !question.prompt.trim()
      ) {
        if (
          showMessage
        ) {
          window.alert(
            `Câu ${index + 1} chưa có nội dung.`
          );
        }
        return false;
      }

      if (
        question.answers.some(
          (answer) =>
            !answer.trim()
        )
      ) {
        if (
          showMessage
        ) {
          window.alert(
            `Câu ${index + 1} cần đủ 4 đáp án.`
          );
        }
        return false;
      }
    }

    return true;
  }

  function createNewGame() {
    const next =
      createBlankGame();

    setDraft(
      next
    );
    setActiveGameId(
      null
    );
    setMode(
      "builder"
    );
    setSavedFlash(
      false
    );
  }

  function openGame(
    game: GameSet
  ) {
    setDraft(
      cloneGame(
        game
      )
    );
    setActiveGameId(
      game.id
    );
    setMode(
      "builder"
    );
    setSavedFlash(
      false
    );
  }

  function saveGame() {
    if (
      !validateGame(
        draft
      )
    ) {
      return;
    }

    const saved: GameSet =
      {
        ...cloneGame(
          draft
        ),
        title:
          draft.title.trim(),
        description:
          draft.description.trim(),
        updatedAt:
          new Date().toISOString(),
      };

    const exists =
      games.some(
        (game) =>
          game.id ===
          saved.id
      );

    const next =
      exists
        ? games.map(
            (game) =>
              game.id ===
              saved.id
                ? saved
                : game
          )
        : [
            saved,
            ...games,
          ];

    persistGames(
      next
    );
    setDraft(
      cloneGame(
        saved
      )
    );
    setActiveGameId(
      saved.id
    );
    setSavedFlash(
      true
    );

    window.setTimeout(
      () =>
        setSavedFlash(
          false
        ),
      1600
    );
  }

  function duplicateGame() {
    if (
      !validateGame(
        draft
      )
    ) {
      return;
    }

    const copy: GameSet =
      {
        ...cloneGame(
          draft
        ),
        id:
          makeGameId(
            "game"
          ),
        title: `${draft.title.trim()} - Bản sao`,
        updatedAt:
          new Date().toISOString(),
        questions:
          draft.questions.map(
            (question) => ({
              ...question,
              id:
                makeGameId(
                  "question"
                ),
              answers: [
                question.answers[0],
                question.answers[1],
                question.answers[2],
                question.answers[3],
              ],
            })
          ),
      };

    persistGames(
      [
        copy,
        ...games,
      ]
    );
    setDraft(
      cloneGame(
        copy
      )
    );
    setActiveGameId(
      copy.id
    );
  }

  function deleteGame(
    gameId: string
  ) {
    const game =
      games.find(
        (item) =>
          item.id ===
          gameId
      );

    if (
      !game
    ) {
      return;
    }

    if (
      !window.confirm(
        `Xóa trò chơi "${game.title}"?`
      )
    ) {
      return;
    }

    const next =
      games.filter(
        (item) =>
          item.id !==
          gameId
      );

    persistGames(
      next
    );

    persistGameLinks(
      gameLinks.filter(
        (link) =>
          link.gameId !==
          gameId
      )
    );

    if (
      activeGameId ===
      gameId
    ) {
      if (
        next.length >
        0
      ) {
        setActiveGameId(
          next[0].id
        );
        setDraft(
          cloneGame(
            next[0]
          )
        );
      } else {
        setActiveGameId(
          null
        );
        setDraft(
          createBlankGame()
        );
      }
    }
  }

  function addQuestion() {
    setDraft(
      (currentDraft) => ({
        ...currentDraft,
        questions: [
          ...currentDraft.questions,
          createBlankQuestion(),
        ],
      })
    );
  }

  function removeQuestion(
    questionId: string
  ) {
    setDraft(
      (currentDraft) => {
        if (
          currentDraft.questions.length <=
          1
        ) {
          window.alert(
            "Trò chơi cần ít nhất 1 câu hỏi."
          );
          return currentDraft;
        }

        return {
          ...currentDraft,
          questions:
            currentDraft.questions.filter(
              (question) =>
                question.id !==
                questionId
            ),
        };
      }
    );
  }

  function updateQuestionPrompt(
    questionId: string,
    value: string
  ) {
    setDraft(
      (currentDraft) => ({
        ...currentDraft,
        questions:
          currentDraft.questions.map(
            (question) =>
              question.id ===
              questionId
                ? {
                    ...question,
                    prompt:
                      value,
                  }
                : question
          ),
      })
    );
  }

  function updateAnswer(
    questionId: string,
    answerIndex: number,
    value: string
  ) {
    setDraft(
      (currentDraft) => ({
        ...currentDraft,
        questions:
          currentDraft.questions.map(
            (question) => {
              if (
                question.id !==
                questionId
              ) {
                return question;
              }

              const answers =
                [
                  ...question.answers,
                ] as [
                  string,
                  string,
                  string,
                  string,
                ];

              answers[
                answerIndex
              ] =
                value;

              return {
                ...question,
                answers,
              };
            }
          ),
      })
    );
  }

  function setCorrectAnswer(
    questionId: string,
    answerIndex: number
  ) {
    setDraft(
      (currentDraft) => ({
        ...currentDraft,
        questions:
          currentDraft.questions.map(
            (question) =>
              question.id ===
              questionId
                ? {
                    ...question,
                    correct:
                      answerIndex,
                  }
                : question
          ),
      })
    );
  }

  function startPlay() {
    if (
      !validateGame(
        draft
      )
    ) {
      return;
    }

    setCurrent(0);
    setScore(0);
    setSelected(
      null
    );
    setFinished(
      false
    );
    setMode(
      "play"
    );
  }

  function choose(
    index: number
  ) {
    if (
      selected !==
        null ||
      finished
    ) {
      return;
    }

    setSelected(
      index
    );

    if (
      index ===
      draft.questions[
        current
      ].correct
    ) {
      setScore(
        (value) =>
          value + 1
      );
    }
  }

  function nextQuestion() {
    if (
      current >=
      draft.questions.length -
        1
    ) {
      setFinished(
        true
      );
      return;
    }

    setCurrent(
      (value) =>
        value + 1
    );
    setSelected(
      null
    );
  }

  function restartPlay() {
    setCurrent(0);
    setScore(0);
    setSelected(
      null
    );
    setFinished(
      false
    );
  }

  const playQuestion =
    draft.questions[
      current
    ];

  const selectedAttachProject =
    availableProjects.find(
      (entry) =>
        entry.project.id ===
        attachProjectId
    ) ??
    null;

  const currentGameLinks =
    gameLinks.filter(
      (link) =>
        link.gameId ===
        draft.id
    );

  function projectTitle(
    projectId: string
  ) {
    return (
      availableProjects.find(
        (entry) =>
          entry.project.id ===
          projectId
      )?.project.title ??
      "Dự án không còn tồn tại"
    );
  }

  function pageTitle(
    projectId: string,
    pageId: string
  ) {
    return (
      availableProjects
        .find(
          (entry) =>
            entry.project.id ===
            projectId
        )
        ?.project.pages.find(
          (pageItem) =>
            pageItem.id ===
            pageId
        )?.title ??
      "Trang không còn tồn tại"
    );
  }

  return (
    <div>
      <WorkspaceHeader
        title="Trò chơi tương tác"
        description="Tự tạo bộ câu hỏi, lưu trên trình duyệt, mở lại để chỉnh sửa và chơi thử ngay trong VLearning Studio."
        onOpenMenu={
          onOpenMenu
        }
      />

      {mode ===
      "play" ? (
        <div className="mx-auto mt-6 max-w-3xl rounded-[24px] border border-blue-800/70 bg-[#0c2b50] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setMode(
                  "builder"
                )
              }
              className="rounded-xl border border-blue-700 bg-[#092542] px-4 py-2.5 text-xs font-black text-cyan-200 hover:bg-[#0d315a]"
            >
              ← Quay lại chỉnh sửa
            </button>

            <div className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-black text-cyan-200">
              {draft.title}
            </div>
          </div>

          {finished ? (
            <div className="py-10 text-center">
              <CheckCircle2
                size={56}
                className="mx-auto text-emerald-400"
              />

              <div className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
                Hoàn thành
              </div>

              <div className="mt-2 text-5xl font-black">
                {score}/
                {
                  draft.questions.length
                }
              </div>

              <div className="mt-3 text-lg font-black text-amber-300">
                {Math.round(
                  (score /
                    draft.questions.length) *
                    100
                )}
                %
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={
                    restartPlay
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500"
                >
                  <RotateCcw
                    size={17}
                  />
                  Chơi lại
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMode(
                      "builder"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-700 bg-[#092542] px-5 py-3 text-sm font-black text-cyan-200"
                >
                  <Pencil
                    size={17}
                  />
                  Chỉnh sửa
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-7 flex justify-between text-xs font-black text-cyan-300">
                <span>
                  Câu{" "}
                  {current + 1}/
                  {
                    draft.questions.length
                  }
                </span>
                <span>
                  Điểm:{" "}
                  {score}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-black leading-snug">
                {
                  playQuestion.prompt
                }
              </h2>

              <div className="mt-6 grid gap-3">
                {playQuestion.answers.map(
                  (
                    answer,
                    index
                  ) => {
                    const correct =
                      index ===
                      playQuestion.correct;

                    const chosen =
                      index ===
                      selected;

                    const style =
                      selected ===
                      null
                        ? "border-blue-800 bg-[#092542] hover:border-cyan-500/60"
                        : correct
                          ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100"
                          : chosen
                            ? "border-red-500/70 bg-red-500/10 text-red-100"
                            : "border-blue-900 bg-[#092542] opacity-60";

                    return (
                      <button
                        key={`${playQuestion.id}-${index}`}
                        type="button"
                        onClick={() =>
                          choose(
                            index
                          )
                        }
                        className={`rounded-xl border p-4 text-left text-sm font-bold transition ${style}`}
                      >
                        <span className="mr-2 text-cyan-300">
                          {String.fromCharCode(
                            65 +
                              index
                          )}
                          .
                        </span>
                        {answer}
                      </button>
                    );
                  }
                )}
              </div>

              {selected !==
                null && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-blue-800 bg-[#08223e] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-bold text-slate-300">
                    {selected ===
                    playQuestion.correct
                      ? "Chính xác! ✓"
                      : "Chưa đúng. Đáp án đúng đã được đánh dấu."}
                  </div>

                  <button
                    type="button"
                    onClick={
                      nextQuestion
                    }
                    className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black hover:bg-blue-500"
                  >
                    {current ===
                    draft.questions.length -
                      1
                      ? "Xem kết quả"
                      : "Câu tiếp theo"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* GAME LIBRARY */}
          <aside className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-4">
            <button
              type="button"
              onClick={
                createNewGame
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-black"
            >
              <Plus
                size={17}
              />
              Tạo trò chơi mới
            </button>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Thư viện
              </div>
              <div className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black text-cyan-300">
                {games.length}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {games.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-blue-800 p-4 text-center text-xs leading-5 text-slate-500">
                  Chưa có trò chơi đã lưu.
                </div>
              ) : (
                games
                  .slice()
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      new Date(
                        b.updatedAt
                      ).getTime() -
                      new Date(
                        a.updatedAt
                      ).getTime()
                  )
                  .map(
                    (game) => (
                      <div
                        key={
                          game.id
                        }
                        className={`rounded-xl border p-3 ${
                          activeGameId ===
                          game.id
                            ? "border-cyan-500/60 bg-cyan-500/10"
                            : "border-blue-900 bg-[#092542]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openGame(
                              game
                            )
                          }
                          className="w-full text-left"
                        >
                          <div className="line-clamp-2 text-sm font-black">
                            {
                              game.title
                            }
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            {
                              game.questions.length
                            }{" "}
                            câu hỏi •{" "}
                            {
                              gameLinks.filter(
                                (link) =>
                                  link.gameId ===
                                  game.id
                              ).length
                            }{" "}
                            liên kết
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteGame(
                              game.id
                            )
                          }
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300"
                        >
                          <Trash2
                            size={12}
                          />
                          Xóa
                        </button>
                      </div>
                    )
                  )
              )}
            </div>
          </aside>

          {/* BUILDER */}
          <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
                  Game Builder
                </div>
                <h2 className="mt-1 text-2xl font-black">
                  Thiết kế trò chơi
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    saveGame
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black hover:bg-emerald-500"
                >
                  <Save
                    size={15}
                  />
                  {savedFlash
                    ? "Đã lưu ✓"
                    : "Lưu"}
                </button>

                <button
                  type="button"
                  onClick={
                    duplicateGame
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-700 bg-purple-950/40 px-4 py-2.5 text-xs font-black text-purple-200"
                >
                  <Copy
                    size={15}
                  />
                  Nhân bản
                </button>

                <button
                  type="button"
                  onClick={
                    startPlay
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black hover:bg-blue-500"
                >
                  <Play
                    size={15}
                  />
                  Chơi thử
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_260px]">
              <div>
                <label className="block text-xs font-black text-slate-400">
                  TÊN TRÒ CHƠI
                </label>
                <input
                  value={
                    draft.title
                  }
                  onChange={(
                    event
                  ) =>
                    setDraft(
                      {
                        ...draft,
                        title:
                          event.target.value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm font-bold outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400">
                  SỐ CÂU HỎI
                </label>
                <div className="mt-2 rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm font-black text-cyan-300">
                  {
                    draft.questions.length
                  }{" "}
                  câu
                </div>
              </div>
            </div>

            <label className="mt-4 block text-xs font-black text-slate-400">
              MÔ TẢ
            </label>
            <textarea
              value={
                draft.description
              }
              onChange={(
                event
              ) =>
                setDraft(
                  {
                    ...draft,
                    description:
                      event.target.value,
                  }
                )
              }
              placeholder="Mô tả ngắn về trò chơi..."
              className="mt-2 min-h-[76px] w-full rounded-xl border border-blue-800 bg-[#08233f] p-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500"
            />


            <div className="mt-7 rounded-2xl border border-cyan-700/40 bg-cyan-950/20 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
                    Gắn vào bài giảng
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">
                    Chọn dự án và trang để liên kết trò chơi này với nội dung học.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      reloadProjectsForGame(
                        true
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-950/40 px-2.5 py-1 text-[9px] font-black text-blue-200 hover:bg-blue-900/50"
                  >
                    <RotateCcw
                      size={12}
                    />
                    Làm mới dự án
                  </button>

                  <div className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black text-cyan-200">
                    {currentGameLinks.length} liên kết
                  </div>
                </div>
              </div>

              {availableProjects.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-blue-800 p-5">
                  <div className="text-sm font-bold text-slate-400">
                    Chưa tìm thấy dự án đã lưu.
                  </div>

                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    Nếu cô đã có dự án, bấm “Làm mới dự án”. Hệ thống sẽ đồng bộ dự án đang mở vào thư viện rồi đọc lại danh sách.
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      reloadProjectsForGame(
                        true
                      )
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black hover:bg-blue-500"
                  >
                    <RotateCcw
                      size={14}
                    />
                    Làm mới dự án
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500">
                        Dự án
                      </label>

                      <select
                        value={attachProjectId}
                        onChange={(event) => {
                          const projectId =
                            event.target.value;

                          setAttachProjectId(
                            projectId
                          );

                          const project =
                            availableProjects.find(
                              (entry) =>
                                entry.project.id ===
                                projectId
                            );

                          setAttachPageId(
                            project?.project.pages[0]?.id ??
                              ""
                          );
                        }}
                        className="mt-2 w-full rounded-xl border border-blue-800 bg-[#071d35] px-3 py-3 text-sm outline-none focus:border-cyan-500"
                      >
                        {availableProjects.map(
                          (entry) => (
                            <option
                              key={
                                entry.project.id
                              }
                              value={
                                entry.project.id
                              }
                            >
                              {
                                entry.project.title
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500">
                        Trang
                      </label>

                      <select
                        value={attachPageId}
                        onChange={(event) =>
                          setAttachPageId(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-blue-800 bg-[#071d35] px-3 py-3 text-sm outline-none focus:border-cyan-500"
                      >
                        {(selectedAttachProject?.project.pages ??
                          []).map(
                          (pageItem) => (
                            <option
                              key={
                                pageItem.id
                              }
                              value={
                                pageItem.id
                              }
                            >
                              {
                                pageItem.title
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      attachCurrentGame
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-black hover:bg-cyan-500"
                  >
                    <Gamepad2
                      size={16}
                    />
                    Gắn vào trang đã chọn
                  </button>
                </>
              )}

              {currentGameLinks.length >
                0 && (
                <div className="mt-5 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Đang được sử dụng tại
                  </div>

                  {currentGameLinks.map(
                    (link) => (
                      <div
                        key={
                          link.id
                        }
                        className="flex flex-col gap-3 rounded-xl border border-blue-800 bg-[#071d35] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black">
                            {projectTitle(
                              link.projectId
                            )}
                          </div>
                          <div className="mt-1 truncate text-xs text-cyan-300">
                            {pageTitle(
                              link.projectId,
                              link.pageId
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openLinkedProject(
                                link.projectId
                              )
                            }
                            className="rounded-lg border border-blue-700 bg-blue-950/40 px-3 py-2 text-[11px] font-black text-blue-200"
                          >
                            Mở Project
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              detachGameLink(
                                link.id
                              )
                            }
                            className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-[11px] font-black text-red-300"
                          >
                            Gỡ
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="mt-7 space-y-5">
              {draft.questions.map(
                (
                  question,
                  questionIndex
                ) => (
                  <article
                    key={
                      question.id
                    }
                    className="rounded-2xl border border-blue-800 bg-[#092542] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black text-cyan-300">
                        Câu{" "}
                        {questionIndex +
                          1}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeQuestion(
                            question.id
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-red-950/45 px-3 py-2 text-[11px] font-black text-red-300 hover:bg-red-950/70"
                      >
                        <Trash2
                          size={13}
                        />
                        Xóa câu
                      </button>
                    </div>

                    <textarea
                      value={
                        question.prompt
                      }
                      onChange={(
                        event
                      ) =>
                        updateQuestionPrompt(
                          question.id,
                          event.target.value
                        )
                      }
                      placeholder="Nhập nội dung câu hỏi..."
                      className="mt-4 min-h-[86px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-4 text-sm font-bold outline-none placeholder:text-slate-600 focus:border-cyan-500"
                    />

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {question.answers.map(
                        (
                          answer,
                          answerIndex
                        ) => (
                          <div
                            key={`${question.id}-${answerIndex}`}
                            className={`rounded-xl border p-3 ${
                              question.correct ===
                              answerIndex
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : "border-blue-800 bg-[#071d35]"
                            }`}
                          >
                            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={
                                  question.correct ===
                                  answerIndex
                                }
                                onChange={() =>
                                  setCorrectAnswer(
                                    question.id,
                                    answerIndex
                                  )
                                }
                              />
                              ĐÁP ÁN{" "}
                              {String.fromCharCode(
                                65 +
                                  answerIndex
                              )}
                              {question.correct ===
                                answerIndex &&
                                " • ĐÚNG"}
                            </label>

                            <input
                              value={
                                answer
                              }
                              onChange={(
                                event
                              ) =>
                                updateAnswer(
                                  question.id,
                                  answerIndex,
                                  event.target.value
                                )
                              }
                              placeholder={`Nhập đáp án ${String.fromCharCode(
                                65 +
                                  answerIndex
                              )}`}
                              className="mt-2 w-full bg-transparent py-1 text-sm outline-none placeholder:text-slate-600"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </article>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                addQuestion
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-600/60 bg-cyan-950/20 px-4 py-4 text-sm font-black text-cyan-300 hover:bg-cyan-950/40"
            >
              <Plus
                size={17}
              />
              Thêm câu hỏi
            </button>
          </section>
        </div>
      )}
    </div>
  );
}


type ScriptDraft = {
  id: string;
  title: string;
  topic: string;
  subject: string;
  grade: string;
  audience: string;
  duration: number;
  lessonType: string;
  deliveryMode: string;
  priorKnowledge: string;
  keyContent: string;
  keywords: string;
  knowledgeObjectives: string;
  skillObjectives: string;
  competencyObjectives: string;
  qualityObjectives: string;
  methods: string;
  voiceStyle: string;
  interactionLevel: "light" | "balanced" | "high";
  mediaNeeds: string;
  assessmentFocus: string;
  teacherNotes: string;
  result: string;
  updatedAt: string;
};

const SCRIPT_LIBRARY_KEY =
  "vlearning-script-library-v2";

function createScriptId() {
  try {
    return `script-${crypto.randomUUID()}`;
  } catch {
    return `script-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }
}

function createBlankScript(
  preferences: AiPreferences
): ScriptDraft {
  return {
    id:
      createScriptId(),
    title:
      "Kịch bản mới",
    topic:
      "",
    subject:
      "",
    grade:
      "",
    audience:
      "Học sinh",
    duration:
      preferences.defaultDuration,
    lessonType:
      "Bài học hình thành kiến thức mới",
    deliveryMode:
      "Video tương tác + câu hỏi",
    priorKnowledge:
      "",
    keyContent:
      "",
    keywords:
      "",
    knowledgeObjectives:
      "",
    skillObjectives:
      "",
    competencyObjectives:
      "",
    qualityObjectives:
      "",
    methods:
      "Gợi mở – vấn đáp; trực quan; thực hành; phản hồi tức thời",
    voiceStyle:
      "Rõ ràng, thân thiện, tốc độ vừa phải, ngôn ngữ phù hợp lứa tuổi",
    interactionLevel:
      preferences.includeActivities
        ? "balanced"
        : "light",
    mediaNeeds:
      "",
    assessmentFocus:
      "",
    teacherNotes:
      "",
    result:
      "",
    updatedAt:
      new Date().toISOString(),
  };
}

function normalizeScriptLibrary(
  raw: unknown
): ScriptDraft[] {
  if (
    !Array.isArray(
      raw
    )
  ) {
    return [];
  }

  return raw.flatMap(
    (entry) => {
      if (
        !entry ||
        typeof entry !==
          "object"
      ) {
        return [];
      }

      const item =
        entry as Partial<ScriptDraft>;

      if (
        typeof item.id !==
          "string" ||
        typeof item.topic !==
          "string"
      ) {
        return [];
      }

      return [
        {
          id:
            item.id,
          title:
            typeof item.title ===
            "string"
              ? item.title
              : "Kịch bản",
          topic:
            item.topic,
          subject:
            typeof item.subject ===
            "string"
              ? item.subject
              : "",
          grade:
            typeof item.grade ===
            "string"
              ? item.grade
              : "",
          audience:
            typeof item.audience ===
            "string"
              ? item.audience
              : "Học sinh",
          duration:
            typeof item.duration ===
            "number"
              ? item.duration
              : 45,
          lessonType:
            typeof item.lessonType ===
            "string"
              ? item.lessonType
              : "Bài học hình thành kiến thức mới",
          deliveryMode:
            typeof item.deliveryMode ===
            "string"
              ? item.deliveryMode
              : "Video tương tác + câu hỏi",
          priorKnowledge:
            typeof item.priorKnowledge ===
            "string"
              ? item.priorKnowledge
              : "",
          keyContent:
            typeof item.keyContent ===
            "string"
              ? item.keyContent
              : "",
          keywords:
            typeof item.keywords ===
            "string"
              ? item.keywords
              : "",
          knowledgeObjectives:
            typeof item.knowledgeObjectives ===
            "string"
              ? item.knowledgeObjectives
              : "",
          skillObjectives:
            typeof item.skillObjectives ===
            "string"
              ? item.skillObjectives
              : "",
          competencyObjectives:
            typeof item.competencyObjectives ===
            "string"
              ? item.competencyObjectives
              : "",
          qualityObjectives:
            typeof item.qualityObjectives ===
            "string"
              ? item.qualityObjectives
              : "",
          methods:
            typeof item.methods ===
            "string"
              ? item.methods
              : "",
          voiceStyle:
            typeof item.voiceStyle ===
            "string"
              ? item.voiceStyle
              : "",
          interactionLevel:
            item.interactionLevel ===
              "light" ||
            item.interactionLevel ===
              "high"
              ? item.interactionLevel
              : "balanced",
          mediaNeeds:
            typeof item.mediaNeeds ===
            "string"
              ? item.mediaNeeds
              : "",
          assessmentFocus:
            typeof item.assessmentFocus ===
            "string"
              ? item.assessmentFocus
              : "",
          teacherNotes:
            typeof item.teacherNotes ===
            "string"
              ? item.teacherNotes
              : "",
          result:
            typeof item.result ===
            "string"
              ? item.result
              : "",
          updatedAt:
            typeof item.updatedAt ===
            "string"
              ? item.updatedAt
              : new Date().toISOString(),
        },
      ];
    }
  );
}

function ScriptPanel({
  preferences,
  onOpenMenu,
}: {
  preferences: AiPreferences;
  onOpenMenu: () => void;
}) {
  const [
    library,
    setLibrary,
  ] =
    useState<ScriptDraft[]>(
      []
    );

  const [
    draft,
    setDraft,
  ] =
    useState<ScriptDraft>(
      () =>
        createBlankScript(
          preferences
        )
    );

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    savedFlash,
    setSavedFlash,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          SCRIPT_LIBRARY_KEY
        );

      if (
        !raw
      ) {
        return;
      }

      const parsed =
        normalizeScriptLibrary(
          JSON.parse(
            raw
          )
        );

      setLibrary(
        parsed
      );

      if (
        parsed.length >
        0
      ) {
        setDraft(
          parsed[0]
        );
      }
    } catch {
      // Start with a clean local script library.
    }
  }, []);

  useEffect(() => {
    setDraft(
      (current) => ({
        ...current,
        duration:
          current.duration ||
          preferences.defaultDuration,
      })
    );
  }, [
    preferences.defaultDuration,
  ]);

  function persistLibrary(
    next: ScriptDraft[]
  ) {
    setLibrary(
      next
    );

    try {
      localStorage.setItem(
        SCRIPT_LIBRARY_KEY,
        JSON.stringify(
          next
        )
      );
    } catch {
      window.alert(
        "Không thể lưu thư viện kịch bản trên trình duyệt."
      );
    }
  }

  function updateDraft<
    K extends keyof ScriptDraft
  >(
    key: K,
    value: ScriptDraft[K]
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
    setSavedFlash(
      false
    );
  }

  function newScript() {
    setDraft(
      createBlankScript(
        preferences
      )
    );
    setCopied(
      false
    );
    setSavedFlash(
      false
    );
  }

  function openScript(
    script: ScriptDraft
  ) {
    setDraft({
      ...script,
    });
    setCopied(
      false
    );
    setSavedFlash(
      false
    );
  }

  function saveScript() {
    if (
      !draft.topic.trim()
    ) {
      window.alert(
        "Hãy nhập chủ đề trước khi lưu."
      );
      return;
    }

    const saved: ScriptDraft =
      {
        ...draft,
        title:
          draft.title.trim() ||
          draft.topic.trim(),
        updatedAt:
          new Date().toISOString(),
      };

    const exists =
      library.some(
        (item) =>
          item.id ===
          saved.id
      );

    const next =
      exists
        ? library.map(
            (item) =>
              item.id ===
              saved.id
                ? saved
                : item
          )
        : [
            saved,
            ...library,
          ];

    persistLibrary(
      next
    );
    setDraft(
      saved
    );
    setSavedFlash(
      true
    );

    window.setTimeout(
      () =>
        setSavedFlash(
          false
        ),
      1600
    );
  }

  function deleteScript(
    scriptId: string
  ) {
    const item =
      library.find(
        (script) =>
          script.id ===
          scriptId
      );

    if (
      !item
    ) {
      return;
    }

    if (
      !window.confirm(
        `Xóa kịch bản "${item.title}"?`
      )
    ) {
      return;
    }

    const next =
      library.filter(
        (script) =>
          script.id !==
          scriptId
      );

    persistLibrary(
      next
    );

    if (
      draft.id ===
      scriptId
    ) {
      setDraft(
        next[0] ??
        createBlankScript(
          preferences
        )
      );
    }
  }

  function minutes(
    ratio: number,
    minimum = 1
  ) {
    return Math.max(
      minimum,
      Math.round(
        Math.max(
          10,
          draft.duration
        ) *
          ratio
      )
    );
  }

  function generate() {
    const topic =
      draft.topic.trim();

    if (
      !topic
    ) {
      window.alert(
        "Hãy nhập chủ đề bài giảng."
      );
      return;
    }

    const total =
      Math.max(
        10,
        Number(
          draft.duration
        ) ||
          preferences.defaultDuration
      );

    const warmup =
      minutes(
        0.1,
        3
      );

    const objective =
      minutes(
        0.05,
        2
      );

    const knowledge =
      minutes(
        0.42,
        8
      );

    const practice =
      minutes(
        0.18,
        5
      );

    const application =
      minutes(
        0.13,
        4
      );

    const assessment =
      Math.max(
        4,
        total -
          warmup -
          objective -
          knowledge -
          practice -
          application
      );

    const interactionCount =
      draft.interactionLevel ===
      "high"
        ? "5–7"
        : draft.interactionLevel ===
            "light"
          ? "2–3"
          : "3–5";

    const detailInstruction =
      preferences.detail ===
      "detailed"
        ? "Mỗi ý cần có giải thích, ví dụ, câu hỏi gợi mở và phản hồi dự kiến."
        : preferences.detail ===
            "short"
          ? "Ưu tiên câu ngắn, rõ ý, tránh diễn giải dài."
          : "Cân bằng giữa giải thích, ví dụ, trực quan và tương tác.";

    const objectives =
      [
        draft.knowledgeObjectives.trim()
          ? `- Kiến thức: ${draft.knowledgeObjectives.trim()}`
          : "- Kiến thức: Nêu/giải thích được kiến thức trọng tâm của bài.",
        draft.skillObjectives.trim()
          ? `- Kĩ năng: ${draft.skillObjectives.trim()}`
          : "- Kĩ năng: Thực hiện được nhiệm vụ học tập và vận dụng kiến thức vào tình huống phù hợp.",
        draft.competencyObjectives.trim()
          ? `- Năng lực: ${draft.competencyObjectives.trim()}`
          : "- Năng lực: Tự học, giao tiếp/hợp tác và giải quyết vấn đề theo yêu cầu của bài.",
        draft.qualityObjectives.trim()
          ? `- Phẩm chất: ${draft.qualityObjectives.trim()}`
          : "- Phẩm chất: Hình thành thái độ tích cực, trách nhiệm và chủ động trong học tập.",
      ].join(
        "\n"
      );

    const keyContent =
      draft.keyContent.trim()
        ? draft.keyContent.trim()
        : `1) Khái niệm/kiến thức cốt lõi của ${topic}
2) Ví dụ minh họa
3) Lỗi thường gặp hoặc điểm cần lưu ý
4) Vận dụng trong tình huống thực tế`;

    const priorKnowledge =
      draft.priorKnowledge.trim()
        ? draft.priorKnowledge.trim()
        : "Kiểm tra nhanh kiến thức nền có liên quan trước khi bắt đầu nội dung mới.";

    const media =
      draft.mediaNeeds.trim()
        ? draft.mediaNeeds.trim()
        : "Hình ảnh minh họa, sơ đồ ngắn, từ khóa nổi bật, video/animation ngắn khi cần.";

    const assessmentFocus =
      draft.assessmentFocus.trim()
        ? draft.assessmentFocus.trim()
        : "Mức độ hiểu khái niệm, khả năng phân biệt/nhận biết, áp dụng và tự giải thích.";

    const teacherNotes =
      draft.teacherNotes.trim()
        ? `\nGHI CHÚ RIÊNG CỦA GIÁO VIÊN\n${draft.teacherNotes.trim()}\n`
        : "";

    const result =
`KỊCH BẢN BÀI GIẢNG TƯƠNG TÁC – VLEARNING STUDIO

I. THÔNG TIN CHUNG
Tên kịch bản: ${draft.title.trim() || topic}
Chủ đề/Bài học: ${topic}
Môn/Lĩnh vực: ${draft.subject.trim() || "Chưa xác định"}
Khối/Lớp: ${draft.grade.trim() || "Chưa xác định"}
Đối tượng: ${draft.audience.trim() || "Học sinh"}
Loại bài: ${draft.lessonType}
Hình thức: ${draft.deliveryMode}
Thời lượng dự kiến: ${total} phút
Phong cách lời dẫn: ${draft.voiceStyle}
Mức độ tương tác: ${draft.interactionLevel === "high" ? "Cao" : draft.interactionLevel === "light" ? "Nhẹ" : "Cân bằng"}
Từ khóa: ${draft.keywords.trim() || topic}

II. MỤC TIÊU BÀI HỌC
${objectives}

III. KIẾN THỨC NỀN / ĐIỀU KIỆN ĐẦU VÀO
${priorKnowledge}

IV. NỘI DUNG TRỌNG TÂM
${keyContent}

V. PHƯƠNG PHÁP – KĨ THUẬT DẠY HỌC
${draft.methods.trim() || "Gợi mở – vấn đáp; trực quan; thực hành; phản hồi tức thời."}

VI. HỌC LIỆU – PHƯƠNG TIỆN
${media}

VII. NGUYÊN TẮC THIẾT KẾ E-LEARNING
- Mỗi phân đoạn video chỉ tập trung 1 ý chính.
- Sau 2–4 phút nên có một tín hiệu tương tác hoặc thay đổi hoạt động.
- Tránh đưa quá nhiều chữ lên màn hình; ưu tiên từ khóa, hình, sơ đồ.
- Dùng phản hồi ngay sau câu trả lời để giải thích vì sao đúng/sai.
- ${detailInstruction}
- Dự kiến ${interactionCount} điểm tương tác trong toàn bài.

VIII. KỊCH BẢN THEO TIẾN TRÌNH

PHÂN CẢNH 1 – KHỞI ĐỘNG (${warmup} phút)
Mục tiêu:
- Gây chú ý và kích hoạt kiến thức nền.
- Tạo tình huống có vấn đề liên quan trực tiếp đến ${topic}.

Hình ảnh/Video:
- Mở bằng một hình ảnh, tình huống hoặc câu hỏi gần gũi.
- Hiện tiêu đề bài học bằng hiệu ứng nhẹ.

Lời dẫn gợi ý:
“Các em hãy quan sát tình huống trên màn hình. Theo em, điều gì đang xảy ra? Vì sao chúng ta cần tìm hiểu về ${topic}?”

Tương tác:
- 1 câu hỏi dự đoán hoặc lựa chọn nhanh.
- Cho người học suy nghĩ 5–10 giây trước khi hiện đáp án/gợi ý.

Phản hồi:
- Đúng: xác nhận và kết nối vào bài.
- Chưa đúng: đưa một gợi ý ngắn, không tiết lộ toàn bộ kiến thức.

PHÂN CẢNH 2 – NÊU MỤC TIÊU (${objective} phút)
Mục tiêu:
- Giúp người học biết rõ sau bài này cần đạt được gì.

Lời dẫn gợi ý:
“Sau bài học này, các em cần nắm được kiến thức trọng tâm, thực hiện được nhiệm vụ vận dụng và tự kiểm tra mức độ hiểu bài của mình.”

Hiển thị:
- 3–4 mục tiêu ngắn, mỗi mục tiêu 1 dòng.
- Có icon minh họa tương ứng.

PHÂN CẢNH 3 – HÌNH THÀNH KIẾN THỨC (${knowledge} phút)
Nội dung:
${keyContent}

Cách triển khai:
1. Giới thiệu ý chính thứ nhất → giải thích bằng ngôn ngữ đơn giản.
2. Minh họa bằng hình/sơ đồ/ví dụ.
3. Đặt câu hỏi kiểm tra nhanh.
4. Chuyển sang ý tiếp theo bằng câu nối logic.
5. Cuối phần có bảng/tóm tắt từ khóa.

Lời dẫn mẫu:
“Trước hết, chúng ta cần hiểu điểm cốt lõi của ${topic}. Hãy chú ý vào từ khóa đang được làm nổi bật trên màn hình.”
“Bây giờ, chúng ta xem một ví dụ để thấy kiến thức này được sử dụng như thế nào.”
“Em hãy dừng lại một chút và thử trả lời câu hỏi sau trước khi xem phần giải thích.”

Điểm tương tác gợi ý:
- Câu hỏi 1: nhận biết khái niệm/đặc điểm.
- Câu hỏi 2: chọn ví dụ đúng.
- Câu hỏi 3: phát hiện lỗi/sai lầm phổ biến.

PHÂN CẢNH 4 – LUYỆN TẬP (${practice} phút)
Mục tiêu:
- Củng cố kiến thức vừa học.
- Chuyển từ “biết” sang “làm được”.

Hoạt động:
- 2–3 nhiệm vụ từ dễ đến khó.
- Có ít nhất 1 câu hỏi tình huống.
- Nếu phù hợp, dùng Game Builder làm hoạt động luyện tập bổ trợ.

Phản hồi:
- Không chỉ báo “Đúng/Sai”.
- Với đáp án sai, giải thích nguyên nhân và chỉ ra từ khóa cần xem lại.

PHÂN CẢNH 5 – VẬN DỤNG (${application} phút)
Mục tiêu:
- Kết nối bài học với bối cảnh thực tế.

Nhiệm vụ:
- Đưa ra một tình huống mới liên quan đến ${topic}.
- Yêu cầu người học lựa chọn giải pháp, giải thích hoặc tạo sản phẩm ngắn.

Lời dẫn gợi ý:
“Bây giờ em hãy vận dụng những gì vừa học vào một tình huống mới. Hãy suy nghĩ trước khi chọn phương án.”

PHÂN CẢNH 6 – ĐÁNH GIÁ VÀ KẾT THÚC (${assessment} phút)
Trọng tâm đánh giá:
${assessmentFocus}

Đề xuất:
- 3 câu trắc nghiệm 1 đáp án đúng.
- 1 câu đúng/sai hoặc nhiều đáp án đúng.
- 1 câu vận dụng ngắn.
- Nếu bài có điều kiện đạt, đặt ngưỡng điểm phù hợp và yêu cầu xem tối thiểu.

Lời kết gợi ý:
“Chúng ta vừa hoàn thành bài học về ${topic}. Em hãy nhớ lại ba ý quan trọng nhất và thử giải thích chúng bằng lời của mình.”

IX. BẢNG KỊCH BẢN CẢNH – LỜI – TƯƠNG TÁC

Cảnh 1 | ${warmup} phút
Màn hình: Tình huống mở đầu + tiêu đề.
Lời dẫn: Gợi mở vấn đề.
Tương tác: Câu hỏi dự đoán.
Mục đích: Tạo hứng thú.

Cảnh 2 | ${objective} phút
Màn hình: Mục tiêu bài học.
Lời dẫn: Nêu yêu cầu cần đạt.
Tương tác: Không bắt buộc.
Mục đích: Định hướng.

Cảnh 3 | ${knowledge} phút
Màn hình: Nội dung chính + minh họa.
Lời dẫn: Giải thích từng ý.
Tương tác: 2–3 câu hỏi chèn giữa video.
Mục đích: Hình thành kiến thức.

Cảnh 4 | ${practice} phút
Màn hình: Bài tập/Game.
Lời dẫn: Hướng dẫn nhiệm vụ.
Tương tác: Trắc nghiệm/Game.
Mục đích: Luyện tập.

Cảnh 5 | ${application} phút
Màn hình: Tình huống mới.
Lời dẫn: Yêu cầu vận dụng.
Tương tác: Chọn giải pháp/viết câu trả lời.
Mục đích: Vận dụng.

Cảnh 6 | ${assessment} phút
Màn hình: Kiểm tra cuối bài + tổng kết.
Lời dẫn: Nhắc lại kiến thức cốt lõi.
Tương tác: Quiz cuối bài.
Mục đích: Đánh giá và hoàn thành.

X. NGÂN HÀNG CÂU HỎI GỢI Ý

1. Câu nhận biết
“Đâu là phát biểu phù hợp nhất về ${topic}?”
A. ...
B. ...
C. ...
D. ...
Đáp án: Giáo viên xác định theo nội dung bài.

2. Câu thông hiểu
“Vì sao nội dung/đặc điểm trên lại quan trọng trong ${topic}?”
A. ...
B. ...
C. ...
D. ...

3. Câu áp dụng
“Trong tình huống sau, em sẽ lựa chọn phương án nào?”
A. ...
B. ...
C. ...
D. ...

4. Câu đúng/sai
“Phát biểu sau về ${topic} là đúng hay sai? Giải thích ngắn.”

5. Câu vận dụng
“Hãy nêu một ví dụ thực tế và giải thích cách em sử dụng kiến thức của bài.”

XI. KỊCH BẢN PHẢN HỒI
Khi đúng:
- “Chính xác! Em đã xác định đúng ý trọng tâm.”
- “Rất tốt. Hãy ghi nhớ từ khóa này để làm câu tiếp theo.”

Khi sai:
- “Chưa chính xác. Em hãy xem lại phần giải thích ngay trước câu hỏi.”
- “Gợi ý: chú ý đến từ khóa/điều kiện quan trọng trong câu.”

XII. KẾ HOẠCH VIDEO
- Tổng thời lượng: khoảng ${total} phút.
- Chia thành 4–6 đoạn nhỏ thay vì 1 video quá dài.
- Mỗi slide/cảnh chỉ nên có 1 thông điệp chính.
- Dùng zoom nhẹ, highlight hoặc animation để dẫn mắt.
- Tránh chữ quá nhỏ và nền thiếu tương phản.
- Lời đọc nên theo phong cách: ${draft.voiceStyle}

XIII. KẾ HOẠCH TƯƠNG TÁC
- Mật độ: ${draft.interactionLevel === "high" ? "cao" : draft.interactionLevel === "light" ? "nhẹ" : "cân bằng"}.
- Số điểm tương tác gợi ý: ${interactionCount}.
- Ưu tiên chèn câu hỏi sau một đoạn kiến thức, không chèn giữa câu đang nói.
- Game dùng để luyện tập; Quiz chính dùng để tính kết quả học tập.

XIV. KẾ HOẠCH SCORM
- Thiết lập điểm đạt phù hợp mục tiêu.
- Thiết lập tỷ lệ xem video tối thiểu.
- Quyết định có bắt buộc hoàn thành toàn bộ Quiz hay không.
- Kiểm tra Resume.
- Kiểm tra Passed/Failed.
- Kiểm tra chứng nhận nếu sử dụng.
- Chạy thử trên Fake LMS trước khi đưa lên LMS chính thức.

XV. CHECKLIST TRƯỚC KHI XUẤT BẢN
[ ] Tiêu đề và mục tiêu rõ ràng.
[ ] Nội dung đúng trọng tâm.
[ ] Không có đoạn video quá dài và thụ động.
[ ] Các câu hỏi xuất hiện đúng thời điểm.
[ ] Đáp án và phản hồi đã kiểm tra.
[ ] Hình ảnh/video có quyền sử dụng.
[ ] Âm thanh rõ, không quá nhỏ.
[ ] Font đủ lớn, tương phản tốt.
[ ] Preview chạy hoàn chỉnh.
[ ] Game chạy đúng nếu có.
[ ] Điểm đạt và điều kiện hoàn thành đúng.
[ ] SCORM được kiểm thử trên LMS.
${teacherNotes}
GHI CHÚ KỸ THUẬT
Kịch bản này được tạo bằng bộ sinh kịch bản Local của VLearning Studio. Nội dung là khung biên soạn chi tiết để giáo viên tiếp tục hiệu chỉnh theo SGK, tài liệu chuyên môn và mục tiêu cụ thể của bài học.`;

    updateDraft(
      "result",
      result
    );

    updateDraft(
      "duration",
      total
    );

    setCopied(
      false
    );
  }

  async function copyResult() {
    if (
      !draft.result
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        draft.result
      );
      setCopied(
        true
      );
    } catch {
      window.alert(
        "Không thể sao chép tự động. Hãy bôi đen nội dung và sao chép thủ công."
      );
    }
  }

  function downloadResult() {
    if (
      !draft.result
    ) {
      return;
    }

    const blob =
      new Blob(
        [
          draft.result,
        ],
        {
          type:
            "text/plain;charset=utf-8",
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

    anchor.href =
      url;

    anchor.download =
      `${(
        draft.title ||
        draft.topic ||
        "kich-ban"
      )
        .replace(
          /[\\/:*?"<>|]+/g,
          "-"
        )
        .trim()}.txt`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  return (
    <div>
      <WorkspaceHeader
        title="AI kịch bản"
        description="Không chỉ tạo một dàn ý ngắn: mô-đun này xây dựng kịch bản e-learning chi tiết theo mục tiêu, tiến trình, phân cảnh, lời dẫn, tương tác, đánh giá, video và SCORM."
        onOpenMenu={
          onOpenMenu
        }
      />

      <div className="mt-6 grid gap-6 2xl:grid-cols-[270px_430px_1fr]">
        {/* SCRIPT LIBRARY */}
        <aside className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-4">
          <button
            type="button"
            onClick={
              newScript
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-black"
          >
            <Plus
              size={17}
            />
            Kịch bản mới
          </button>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Thư viện
            </div>

            <div className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black text-cyan-300">
              {
                library.length
              }
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {library.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-blue-800 p-4 text-center text-xs leading-5 text-slate-500">
                Chưa có kịch bản đã lưu.
              </div>
            ) : (
              library
                .slice()
                .sort(
                  (
                    a,
                    b
                  ) =>
                    new Date(
                      b.updatedAt
                    ).getTime() -
                    new Date(
                      a.updatedAt
                    ).getTime()
                )
                .map(
                  (script) => (
                    <div
                      key={
                        script.id
                      }
                      className={`rounded-xl border p-3 ${
                        script.id ===
                        draft.id
                          ? "border-cyan-500/60 bg-cyan-500/10"
                          : "border-blue-900 bg-[#092542]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openScript(
                            script
                          )
                        }
                        className="w-full text-left"
                      >
                        <div className="line-clamp-2 text-sm font-black">
                          {
                            script.title
                          }
                        </div>

                        <div className="mt-1 line-clamp-2 text-[10px] text-slate-500">
                          {
                            script.topic
                          }
                        </div>

                        <div className="mt-1 text-[10px] text-cyan-400">
                          {
                            script.duration
                          }{" "}
                          phút
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteScript(
                            script.id
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300"
                      >
                        <Trash2
                          size={12}
                        />
                        Xóa
                      </button>
                    </div>
                  )
                )
            )}
          </div>
        </aside>

        {/* INPUT WORKSPACE */}
        <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
                Thông tin đầu vào
              </div>
              <div className="mt-1 text-lg font-black">
                Thiết kế bài học
              </div>
            </div>

            <button
              type="button"
              onClick={
                saveScript
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black hover:bg-emerald-500"
            >
              <Save
                size={15}
              />
              {savedFlash
                ? "Đã lưu ✓"
                : "Lưu"}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
                Tên kịch bản
              </label>
              <input
                value={
                  draft.title
                }
                onChange={(
                  event
                ) =>
                  updateDraft(
                    "title",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm font-bold outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
                Chủ đề / Bài học *
              </label>
              <textarea
                value={
                  draft.topic
                }
                onChange={(
                  event
                ) =>
                  updateDraft(
                    "topic",
                    event.target.value
                  )
                }
                placeholder="Ví dụ: Phòng chống cháy nổ cho trẻ 4–5 tuổi"
                className="mt-2 min-h-[92px] w-full rounded-xl border border-blue-800 bg-[#08233f] p-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  Môn / Lĩnh vực
                </label>
                <input
                  value={
                    draft.subject
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "subject",
                      event.target.value
                    )
                  }
                  placeholder="Toán, Tiếng Anh..."
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  Khối / Lớp
                </label>
                <input
                  value={
                    draft.grade
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "grade",
                      event.target.value
                    )
                  }
                  placeholder="Lớp 6..."
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  Đối tượng
                </label>
                <input
                  value={
                    draft.audience
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "audience",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  Thời lượng
                </label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={
                    draft.duration
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "duration",
                      Math.max(
                        10,
                        Number(
                          event.target.value
                        ) || 10
                      )
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500">
                Loại bài
              </label>
              <select
                value={
                  draft.lessonType
                }
                onChange={(
                  event
                ) =>
                  updateDraft(
                    "lessonType",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm outline-none"
              >
                <option>
                  Bài học hình thành kiến thức mới
                </option>
                <option>
                  Bài luyện tập – củng cố
                </option>
                <option>
                  Bài ôn tập
                </option>
                <option>
                  Bài thực hành – trải nghiệm
                </option>
                <option>
                  Bài kiểm tra – đánh giá
                </option>
                <option>
                  Bài truyền thông – kỹ năng sống
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500">
                Hình thức triển khai
              </label>
              <select
                value={
                  draft.deliveryMode
                }
                onChange={(
                  event
                ) =>
                  updateDraft(
                    "deliveryMode",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-3 py-3 text-sm outline-none"
              >
                <option>
                  Video tương tác + câu hỏi
                </option>
                <option>
                  Slide + lời dẫn + câu hỏi
                </option>
                <option>
                  Video + Game + Quiz
                </option>
                <option>
                  Tự học hoàn toàn trên LMS
                </option>
                <option>
                  Học kết hợp trên lớp và LMS
                </option>
              </select>
            </div>

            <details
              open
              className="rounded-xl border border-blue-800 bg-[#08233f] p-4"
            >
              <summary className="cursor-pointer text-xs font-black text-cyan-300">
                MỤC TIÊU BÀI HỌC
              </summary>

              <div className="mt-4 space-y-3">
                <textarea
                  value={
                    draft.knowledgeObjectives
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "knowledgeObjectives",
                      event.target.value
                    )
                  }
                  placeholder="Mục tiêu kiến thức..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <textarea
                  value={
                    draft.skillObjectives
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "skillObjectives",
                      event.target.value
                    )
                  }
                  placeholder="Mục tiêu kĩ năng..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <textarea
                  value={
                    draft.competencyObjectives
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "competencyObjectives",
                      event.target.value
                    )
                  }
                  placeholder="Năng lực cần hình thành..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <textarea
                  value={
                    draft.qualityObjectives
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "qualityObjectives",
                      event.target.value
                    )
                  }
                  placeholder="Phẩm chất / thái độ..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />
              </div>
            </details>

            <details className="rounded-xl border border-blue-800 bg-[#08233f] p-4">
              <summary className="cursor-pointer text-xs font-black text-cyan-300">
                NỘI DUNG & KIẾN THỨC NỀN
              </summary>

              <div className="mt-4 space-y-3">
                <textarea
                  value={
                    draft.priorKnowledge
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "priorKnowledge",
                      event.target.value
                    )
                  }
                  placeholder="Học sinh cần biết gì trước bài này?"
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <textarea
                  value={
                    draft.keyContent
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "keyContent",
                      event.target.value
                    )
                  }
                  placeholder="Các nội dung trọng tâm, mỗi ý một dòng..."
                  className="min-h-[110px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <input
                  value={
                    draft.keywords
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "keywords",
                      event.target.value
                    )
                  }
                  placeholder="Từ khóa chính..."
                  className="w-full rounded-xl border border-blue-800 bg-[#071d35] px-3 py-3 text-sm outline-none"
                />
              </div>
            </details>

            <details className="rounded-xl border border-blue-800 bg-[#08233f] p-4">
              <summary className="cursor-pointer text-xs font-black text-cyan-300">
                PHƯƠNG PHÁP – MEDIA – ĐÁNH GIÁ
              </summary>

              <div className="mt-4 space-y-3">
                <textarea
                  value={
                    draft.methods
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "methods",
                      event.target.value
                    )
                  }
                  placeholder="Phương pháp/kĩ thuật dạy học..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <textarea
                  value={
                    draft.mediaNeeds
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "mediaNeeds",
                      event.target.value
                    )
                  }
                  placeholder="Hình ảnh, video, sơ đồ, âm thanh cần dùng..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <textarea
                  value={
                    draft.assessmentFocus
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "assessmentFocus",
                      event.target.value
                    )
                  }
                  placeholder="Trọng tâm cần đánh giá..."
                  className="min-h-[70px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />
              </div>
            </details>

            <details className="rounded-xl border border-blue-800 bg-[#08233f] p-4">
              <summary className="cursor-pointer text-xs font-black text-cyan-300">
                PHONG CÁCH & TƯƠNG TÁC
              </summary>

              <div className="mt-4 space-y-3">
                <textarea
                  value={
                    draft.voiceStyle
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "voiceStyle",
                      event.target.value
                    )
                  }
                  placeholder="Phong cách lời dẫn..."
                  className="min-h-[72px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />

                <select
                  value={
                    draft.interactionLevel
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "interactionLevel",
                      event.target.value as ScriptDraft["interactionLevel"]
                    )
                  }
                  className="w-full rounded-xl border border-blue-800 bg-[#071d35] px-3 py-3 text-sm outline-none"
                >
                  <option value="light">
                    Tương tác nhẹ
                  </option>
                  <option value="balanced">
                    Tương tác cân bằng
                  </option>
                  <option value="high">
                    Tương tác cao
                  </option>
                </select>

                <textarea
                  value={
                    draft.teacherNotes
                  }
                  onChange={(
                    event
                  ) =>
                    updateDraft(
                      "teacherNotes",
                      event.target.value
                    )
                  }
                  placeholder="Ghi chú riêng của giáo viên..."
                  className="min-h-[80px] w-full rounded-xl border border-blue-800 bg-[#071d35] p-3 text-sm outline-none"
                />
              </div>
            </details>

            <button
              type="button"
              onClick={
                generate
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3.5 text-sm font-black shadow-lg transition hover:brightness-110"
            >
              <WandSparkles
                size={18}
              />
              Tạo kịch bản chi tiết
            </button>
          </div>
        </section>

        {/* RESULT */}
        <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
                Kết quả
              </div>
              <div className="mt-1 text-lg font-black">
                Kịch bản hoàn chỉnh
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  copyResult
                }
                disabled={
                  !draft.result
                }
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-600/40 bg-cyan-950/40 px-3 py-2 text-xs font-black text-cyan-200 disabled:opacity-40"
              >
                <Copy
                  size={14}
                />
                {copied
                  ? "Đã sao chép ✓"
                  : "Sao chép"}
              </button>

              <button
                type="button"
                onClick={
                  downloadResult
                }
                disabled={
                  !draft.result
                }
                className="inline-flex items-center gap-2 rounded-lg border border-blue-700 bg-blue-950/40 px-3 py-2 text-xs font-black text-blue-200 disabled:opacity-40"
              >
                <Download
                  size={14}
                />
                Tải TXT
              </button>
            </div>
          </div>

          {draft.result ? (
            <pre className="mt-4 max-h-[calc(100vh-220px)] overflow-auto whitespace-pre-wrap rounded-xl border border-blue-900 bg-[#071d35] p-5 font-sans text-sm leading-7 text-slate-300">
              {
                draft.result
              }
            </pre>
          ) : (
            <div className="mt-4 flex min-h-[620px] items-center justify-center rounded-xl border border-dashed border-blue-800 bg-[#08233f] p-8 text-center">
              <div className="max-w-md">
                <WandSparkles
                  size={42}
                  className="mx-auto text-purple-400"
                />

                <div className="mt-4 text-lg font-black text-slate-300">
                  Chưa có kịch bản
                </div>

                <div className="mt-2 text-sm leading-6 text-slate-500">
                  Điền càng đầy đủ thông tin bên trái, kịch bản tạo ra càng sát với bài học. Sau đó bấm “Tạo kịch bản chi tiết”.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


function AiSettingsPanel({
  preferences,
  onSave,
  onOpenMenu,
}: {
  preferences: AiPreferences;
  onSave: (next: AiPreferences) => void;
  onOpenMenu: () => void;
}) {
  const [draft, setDraft] = useState(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  return (
    <div>
      <WorkspaceHeader
        title="Cài đặt AI"
        description="Thiết lập cho bộ tạo kịch bản Local. Cài đặt được lưu trên trình duyệt."
        onOpenMenu={onOpenMenu}
      />

      <div className="mt-6 max-w-3xl rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6 sm:p-8">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Chế độ: <b>Local</b> — không yêu cầu API key.
        </div>

        <label className="mt-6 block text-xs font-black text-slate-400">
          MỨC ĐỘ CHI TIẾT
        </label>
        <select
          value={draft.detail}
          onChange={(event) =>
            setDraft({
              ...draft,
              detail: event.target.value as AiPreferences["detail"],
            })
          }
          className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm"
        >
          <option value="short">Ngắn gọn</option>
          <option value="balanced">Cân bằng</option>
          <option value="detailed">Chi tiết</option>
        </select>

        <label className="mt-5 block text-xs font-black text-slate-400">
          THỜI LƯỢNG MẶC ĐỊNH
        </label>
        <input
          type="number"
          min={10}
          max={240}
          value={draft.defaultDuration}
          onChange={(event) =>
            setDraft({
              ...draft,
              defaultDuration: Math.max(10, Number(event.target.value) || 10),
            })
          }
          className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm"
        />

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-blue-800 bg-[#08233f] p-4">
          <input
            type="checkbox"
            checked={draft.includeActivities}
            onChange={(event) =>
              setDraft({
                ...draft,
                includeActivities: event.target.checked,
              })
            }
          />
          <span className="text-sm font-bold">
            Thêm hoạt động tương tác
          </span>
        </label>

        <label className="mt-3 flex items-center gap-3 rounded-xl border border-blue-800 bg-[#08233f] p-4">
          <input
            type="checkbox"
            checked={draft.includeAssessment}
            onChange={(event) =>
              setDraft({
                ...draft,
                includeAssessment: event.target.checked,
              })
            }
          />
          <span className="text-sm font-bold">
            Thêm phần đánh giá cuối bài
          </span>
        </label>

        <button
          type="button"
          onClick={() => onSave(draft)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500"
        >
          <Save size={17} />
          Lưu cài đặt
        </button>
      </div>
    </div>
  );
}

function StaticInfoPanel({
  title,
  description,
  children,
  onOpenMenu,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onOpenMenu: () => void;
}) {
  return (
    <div>
      <WorkspaceHeader
        title={title}
        description={description}
        onOpenMenu={onOpenMenu}
      />
      <div className="mt-6 max-w-4xl rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6 text-sm leading-7 text-slate-300 sm:p-8">
        {children}
      </div>
    </div>
  );
}


function AccountPanel({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const [
    session,
    setSession,
  ] =
    useState<ServerSessionUser | null>(
      null
    );

  const [
    mode,
    setMode,
  ] =
    useState<
      "login" | "register"
    >("login");

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    loginEmail,
    setLoginEmail,
  ] =
    useState("");

  const [
    loginPassword,
    setLoginPassword,
  ] =
    useState("");

  const [
    loginRemember,
    setLoginRemember,
  ] =
    useState(true);

  const [
    registerName,
    setRegisterName,
  ] =
    useState("");

  const [
    registerEmail,
    setRegisterEmail,
  ] =
    useState("");

  const [
    registerRole,
    setRegisterRole,
  ] =
    useState(
      "Giáo viên"
    );

  const [
    registerOrganization,
    setRegisterOrganization,
  ] =
    useState("");

  const [
    registerPassword,
    setRegisterPassword,
  ] =
    useState("");

  const [
    registerConfirm,
    setRegisterConfirm,
  ] =
    useState("");

  const [
    registerRemember,
    setRegisterRemember,
  ] =
    useState(true);

  const [
    profileName,
    setProfileName,
  ] =
    useState("");

  const [
    profileRole,
    setProfileRole,
  ] =
    useState("");

  const [
    profileOrganization,
    setProfileOrganization,
  ] =
    useState("");

  const [
    oldPassword,
    setOldPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] =
    useState("");

  const [
    deletePassword,
    setDeletePassword,
  ] =
    useState("");

  async function refreshSession() {
    const current =
      await getServerSession();

    setSession(
      current
    );

    if (
      current
    ) {
      setProfileName(
        current.displayName
      );
      setProfileRole(
        current.role
      );
      setProfileOrganization(
        current.organization
      );
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  function clearStatus() {
    setMessage(
      ""
    );
    setError(
      ""
    );
  }

  async function handleLogin(
    event: FormEvent
  ) {
    event.preventDefault();
    clearStatus();
    setBusy(
      true
    );

    try {
      const user =
        await loginServerAccount(
          {
            email:
              loginEmail,
            password:
              loginPassword,
            remember:
              loginRemember,
          }
        );

      setSession(
        user
      );
      setProfileName(
        user.displayName
      );
      setProfileRole(
        user.role
      );
      setProfileOrganization(
        user.organization
      );
      setLoginPassword(
        ""
      );
      setMessage(
        "Đăng nhập máy chủ thành công."
      );
    } catch (
      authError
    ) {
      setError(
        authError instanceof
        Error
          ? authError.message
          : "Không thể đăng nhập."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  async function handleRegister(
    event: FormEvent
  ) {
    event.preventDefault();
    clearStatus();

    if (
      registerPassword !==
      registerConfirm
    ) {
      setError(
        "Hai mật khẩu chưa trùng nhau."
      );
      return;
    }

    setBusy(
      true
    );

    try {
      const user =
        await registerServerAccount(
          {
            displayName:
              registerName,
            email:
              registerEmail,
            role:
              registerRole,
            organization:
              registerOrganization,
            password:
              registerPassword,
            remember:
              registerRemember,
          }
        );

      setSession(
        user
      );
      setProfileName(
        user.displayName
      );
      setProfileRole(
        user.role
      );
      setProfileOrganization(
        user.organization
      );
      setRegisterPassword(
        ""
      );
      setRegisterConfirm(
        ""
      );
      setMessage(
        "Đã tạo tài khoản trên máy chủ và đăng nhập."
      );
    } catch (
      authError
    ) {
      setError(
        authError instanceof
        Error
          ? authError.message
          : "Không thể tạo tài khoản."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  async function handleSaveProfile() {
    clearStatus();
    setBusy(
      true
    );

    try {
      const user =
        await updateServerAccountProfile(
          {
            displayName:
              profileName,
            role:
              profileRole,
            organization:
              profileOrganization,
          }
        );

      setSession(
        user
      );
      setMessage(
        "Đã cập nhật hồ sơ trên máy chủ."
      );
    } catch (
      authError
    ) {
      setError(
        authError instanceof
        Error
          ? authError.message
          : "Không thể cập nhật hồ sơ."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  async function handleChangePassword() {
    clearStatus();

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setError(
        "Xác nhận mật khẩu mới chưa trùng."
      );
      return;
    }

    setBusy(
      true
    );

    try {
      await changeServerAccountPassword(
        oldPassword,
        newPassword
      );

      setOldPassword(
        ""
      );
      setNewPassword(
        ""
      );
      setConfirmNewPassword(
        ""
      );
      setMessage(
        "Đã đổi mật khẩu."
      );
    } catch (
      authError
    ) {
      setError(
        authError instanceof
        Error
          ? authError.message
          : "Không thể đổi mật khẩu."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  async function handleLogout() {
    clearStatus();
    setBusy(
      true
    );

    try {
      await logoutServerAccount();

      setSession(
        null
      );
      setMessage(
        "Đã đăng xuất khỏi máy chủ."
      );
    } catch (
      authError
    ) {
      setError(
        authError instanceof
        Error
          ? authError.message
          : "Không thể đăng xuất."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  async function handleDeleteAccount() {
    clearStatus();

    if (
      !window.confirm(
        "Xóa tài khoản Local này? Hồ sơ đăng nhập sẽ bị xóa khỏi trình duyệt. Project và bài giảng không bị xóa."
      )
    ) {
      return;
    }

    setBusy(
      true
    );

    try {
      await deleteServerAccount(
        deletePassword
      );

      setDeletePassword(
        ""
      );
      setSession(
        null
      );
      setMessage(
        "Đã xóa tài khoản khỏi cơ sở dữ liệu."
      );
    } catch (
      authError
    ) {
      setError(
        authError instanceof
        Error
          ? authError.message
          : "Không thể xóa tài khoản."
      );
    } finally {
      setBusy(
        false
      );
    }
  }

  const passwordProblems =
    validateServerPassword(
      registerPassword
    );

  if (
    session
  ) {
    return (
      <div>
        <WorkspaceHeader
          title="Tài khoản"
          description="Quản lý hồ sơ, phiên đăng nhập và bảo mật của tài khoản Local trên máy này."
          onOpenMenu={
            onOpenMenu
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-3xl font-black text-cyan-300">
              {session.displayName
                .trim()
                .slice(
                  0,
                  1
                )
                .toUpperCase()}
            </div>

            <div className="mt-5 text-xl font-black">
              {
                session.displayName
              }
            </div>

            <div className="mt-1 break-all text-sm text-slate-400">
              {
                session.email
              }
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-black text-cyan-200">
                TÀI KHOẢN SERVER
              </span>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-200">
                ĐANG ĐĂNG NHẬP
              </span>
            </div>

            <div className="mt-6 space-y-3 border-t border-blue-900 pt-5 text-xs text-slate-400">
              <div>
                <div className="font-black text-slate-500">
                  Vai trò
                </div>
                <div className="mt-1 text-slate-300">
                  {
                    session.role ||
                    "Chưa cập nhật"
                  }
                </div>
              </div>

              <div>
                <div className="font-black text-slate-500">
                  Quyền hệ thống
                </div>
                <div className="mt-1 text-cyan-300">
                  {
                    ACCESS_ROLE_LABELS[
                      session.accessRole
                    ]
                  }
                </div>
              </div>

              <div>
                <div className="font-black text-slate-500">
                  Đơn vị
                </div>
                <div className="mt-1 text-slate-300">
                  {
                    session.organization ||
                    "Chưa cập nhật"
                  }
                </div>
              </div>

              <div>
                <div className="font-black text-slate-500">
                  Lần đăng nhập gần nhất
                </div>
                <div className="mt-1 text-slate-300">
                  {new Date(
                    session.lastLoginAt
                  ).toLocaleString(
                    "vi-VN"
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900 bg-red-950/25 px-4 py-3 text-sm font-black text-red-300 hover:bg-red-950/45"
            >
              Đăng xuất
            </button>
          </aside>

          <div className="space-y-6">
            {(message ||
              error) && (
              <div
                className={`rounded-xl border p-4 text-sm font-bold ${
                  error
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {error ||
                  message}
              </div>
            )}

            <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
                Hồ sơ cá nhân
              </div>

              <h2 className="mt-1 text-xl font-black">
                Thông tin người dùng
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-black text-slate-500">
                    Tên hiển thị
                  </label>

                  <input
                    value={
                      profileName
                    }
                    onChange={(
                      event
                    ) =>
                      setProfileName(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500">
                    Email
                  </label>

                  <input
                    value={
                      session.email
                    }
                    disabled
                    className="mt-2 w-full rounded-xl border border-blue-900 bg-[#071d35] px-4 py-3 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500">
                    Vai trò
                  </label>

                  <select
                    value={
                      profileRole
                    }
                    onChange={(
                      event
                    ) =>
                      setProfileRole(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none"
                  >
                    <option>
                      Giáo viên
                    </option>
                    <option>
                      Cán bộ quản lý
                    </option>
                    <option>
                      Nhân viên thư viện
                    </option>
                    <option>
                      Thiết kế E-learning
                    </option>
                    <option>
                      Học viên
                    </option>
                    <option>
                      Khác
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500">
                    Trường / Đơn vị
                  </label>

                  <input
                    value={
                      profileOrganization
                    }
                    onChange={(
                      event
                    ) =>
                      setProfileOrganization(
                        event.target.value
                      )
                    }
                    placeholder="Tên trường hoặc đơn vị..."
                    className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleSaveProfile
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500"
              >
                <Save
                  size={16}
                />
                Lưu hồ sơ
              </button>
            </section>

            <section className="rounded-[22px] border border-blue-800/70 bg-[#0c2b50] p-6">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-300">
                Bảo mật
              </div>

              <h2 className="mt-1 text-xl font-black">
                Đổi mật khẩu
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <input
                  type="password"
                  value={
                    oldPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setOldPassword(
                      event.target.value
                    )
                  }
                  placeholder="Mật khẩu hiện tại"
                  autoComplete="current-password"
                  className="rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                />

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Mật khẩu mới"
                  autoComplete="new-password"
                  className="rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                />

                <input
                  type="password"
                  value={
                    confirmNewPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  className="rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="mt-3 text-xs leading-5 text-slate-500">
                Mật khẩu cần tối thiểu 8 ký tự, có chữ cái và chữ số. Máy chủ băm mật khẩu bằng scrypt + salt ngẫu nhiên; mật khẩu dạng chữ thường không được lưu.
              </div>

              <button
                type="button"
                onClick={
                  handleChangePassword
                }
                disabled={
                  busy
                }
                className="mt-4 rounded-xl bg-purple-600 px-5 py-3 text-sm font-black disabled:opacity-50"
              >
                Đổi mật khẩu
              </button>
            </section>

            <section className="rounded-[22px] border border-amber-500/25 bg-amber-500/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-amber-300">
                Phạm vi tài khoản
              </div>

              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                <p>
                  Đây là <b className="text-slate-200">tài khoản Server</b> của VLearning Studio, được xác thực qua API và lưu trong cơ sở dữ liệu SQLite.
                </p>

                <p>
                  Đăng nhập hiện được xác thực bởi backend Next.js, phiên đăng nhập lưu trong database và cookie HttpOnly. Đây vẫn là máy chủ VLearning tự quản lý, chưa phải thuê bao PRO trực tuyến.
                </p>

                <p>
                  Project, video và Game vẫn dùng cơ chế lưu trữ riêng của VLearning; đăng xuất không xóa bài giảng.
                </p>
              </div>
            </section>

            <details className="rounded-[22px] border border-red-900/60 bg-red-950/15 p-6">
              <summary className="cursor-pointer text-sm font-black text-red-300">
                Vùng nguy hiểm – Xóa tài khoản Server
              </summary>

              <div className="mt-4 text-xs leading-5 text-slate-500">
                Thao tác này xóa tài khoản và các phiên đăng nhập khỏi database. Project và nội dung bài giảng Local không bị xóa.
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="password"
                  value={
                    deletePassword
                  }
                  onChange={(
                    event
                  ) =>
                    setDeletePassword(
                      event.target.value
                    )
                  }
                  placeholder="Nhập mật khẩu để xác nhận"
                  className="min-w-0 flex-1 rounded-xl border border-red-900 bg-[#071d35] px-4 py-3 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={
                    handleDeleteAccount
                  }
                  disabled={
                    busy ||
                    !deletePassword
                  }
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
                >
                  Xóa tài khoản
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <WorkspaceHeader
        title="Đăng nhập"
        description="Đăng nhập hoặc tạo tài khoản Server để xác thực qua backend và lưu hồ sơ trong cơ sở dữ liệu VLearning."
        onOpenMenu={
          onOpenMenu
        }
      />

      <div className="mx-auto mt-6 max-w-6xl">
        <div className="grid overflow-hidden rounded-[26px] border border-blue-800/70 bg-[#0c2b50] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-gradient-to-br from-[#103b68] via-[#12345e] to-[#1b2456] p-7 sm:p-10">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              VLearning Studio
            </div>

            <h2 className="mt-4 text-3xl font-black leading-tight">
              Không gian thiết kế bài giảng của bạn
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Tài khoản Server giúp xác thực người dùng qua API, lưu hồ sơ trong SQLite và duy trì phiên bằng cookie HttpOnly.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Hồ sơ người dùng: tên, vai trò, trường/đơn vị",
                "Mật khẩu được băm PBKDF2 trước khi lưu",
                "Có tùy chọn ghi nhớ đăng nhập",
                "Có đổi mật khẩu và đăng xuất",
                "Không xóa Project khi đăng xuất",
              ].map(
                (text) => (
                  <div
                    key={
                      text
                    }
                    className="flex gap-3 rounded-xl bg-white/5 p-4 text-sm text-slate-300"
                  >
                    <span className="font-black text-emerald-300">
                      ✓
                    </span>
                    <span>
                      {text}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-8 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
              <b>Lưu ý:</b> đây là backend tài khoản thật chạy trên máy chủ VLearning hiện tại. Để dùng giữa nhiều máy qua Internet, cần triển khai máy chủ này lên hosting/VPS và dùng HTTPS.
            </div>
          </section>

          <section className="p-6 sm:p-9">
            <div className="grid grid-cols-2 rounded-xl bg-[#071d35] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode(
                    "login"
                  );
                  clearStatus();
                }}
                className={`rounded-lg px-4 py-3 text-sm font-black transition ${
                  mode ===
                  "login"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Đăng nhập
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(
                    "register"
                  );
                  clearStatus();
                }}
                className={`rounded-lg px-4 py-3 text-sm font-black transition ${
                  mode ===
                  "register"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Tạo tài khoản
              </button>
            </div>

            {(message ||
              error) && (
              <div
                className={`mt-5 rounded-xl border p-4 text-sm font-bold ${
                  error
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {error ||
                  message}
              </div>
            )}

            {mode ===
            "login" ? (
              <form
                onSubmit={
                  handleLogin
                }
                className="mt-6"
              >
                <h3 className="text-2xl font-black">
                  Chào mừng trở lại
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Đăng nhập bằng tài khoản đã được tạo trong database VLearning.
                </p>

                <label className="mt-6 block text-xs font-black text-slate-500">
                  EMAIL
                </label>

                <input
                  type="email"
                  value={
                    loginEmail
                  }
                  onChange={(
                    event
                  ) =>
                    setLoginEmail(
                      event.target.value
                    )
                  }
                  required
                  autoComplete="email"
                  placeholder="giaovien@example.com"
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3.5 text-sm outline-none focus:border-cyan-500"
                />

                <label className="mt-4 block text-xs font-black text-slate-500">
                  MẬT KHẨU
                </label>

                <input
                  type="password"
                  value={
                    loginPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setLoginPassword(
                      event.target.value
                    )
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3.5 text-sm outline-none focus:border-cyan-500"
                />

                <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={
                      loginRemember
                    }
                    onChange={(
                      event
                    ) =>
                      setLoginRemember(
                        event.target.checked
                      )
                    }
                  />
                  Ghi nhớ đăng nhập trên máy này
                </label>

                <button
                  type="submit"
                  disabled={
                    busy
                  }
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3.5 text-sm font-black text-white shadow-lg disabled:opacity-50"
                >
                  {busy
                    ? "Đang đăng nhập..."
                    : "Đăng nhập"}
                </button>

                <details className="mt-5 rounded-xl border border-blue-900 bg-[#071d35] p-4">
                  <summary className="cursor-pointer text-xs font-black text-cyan-300">
                    Quên mật khẩu?
                  </summary>

                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    Backend A15 chưa cấu hình dịch vụ gửi email, nên chưa thể gửi liên kết đặt lại mật khẩu. Chức năng này cần SMTP hoặc nhà cung cấp email giao dịch ở bước triển khai cloud.
                  </p>
                </details>
              </form>
            ) : (
              <form
                onSubmit={
                  handleRegister
                }
                className="mt-6"
              >
                <h3 className="text-2xl font-black">
                  Tạo tài khoản Local
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Hồ sơ được lưu trong database của máy chủ VLearning đang chạy.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-500">
                      TÊN HIỂN THỊ
                    </label>

                    <input
                      value={
                        registerName
                      }
                      onChange={(
                        event
                      ) =>
                        setRegisterName(
                          event.target.value
                        )
                      }
                      required
                      className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500">
                      EMAIL
                    </label>

                    <input
                      type="email"
                      value={
                        registerEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setRegisterEmail(
                          event.target.value
                        )
                      }
                      required
                      autoComplete="email"
                      className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500">
                      VAI TRÒ HỒ SƠ
                    </label>

                    <select
                      value={
                        registerRole
                      }
                      onChange={(
                        event
                      ) =>
                        setRegisterRole(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm"
                    >
                      <option>
                        Giáo viên
                      </option>
                      <option>
                        Cán bộ quản lý
                      </option>
                      <option>
                        Nhân viên thư viện
                      </option>
                      <option>
                        Thiết kế E-learning
                      </option>
                      <option>
                        Học viên
                      </option>
                      <option>
                        Khác
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500">
                      TRƯỜNG / ĐƠN VỊ
                    </label>

                    <input
                      value={
                        registerOrganization
                      }
                      onChange={(
                        event
                      ) =>
                        setRegisterOrganization(
                          event.target.value
                        )
                      }
                      placeholder="Không bắt buộc"
                      className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-500">
                      MẬT KHẨU
                    </label>

                    <input
                      type="password"
                      value={
                        registerPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setRegisterPassword(
                          event.target.value
                        )
                      }
                      required
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500">
                      NHẬP LẠI MẬT KHẨU
                    </label>

                    <input
                      type="password"
                      value={
                        registerConfirm
                      }
                      onChange={(
                        event
                      ) =>
                        setRegisterConfirm(
                          event.target.value
                        )
                      }
                      required
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-blue-800 bg-[#08233f] px-4 py-3 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs leading-5 text-cyan-100/80">
                  Quyền hệ thống được quản lý riêng: tài khoản đầu tiên của database trở thành <b>Quản trị viên</b>; các tài khoản tự đăng ký sau đó bắt đầu ở quyền <b>Học viên</b> và có thể được Admin nâng lên <b>Giáo viên</b>.
                </div>

                <div className="mt-3 rounded-xl bg-[#071d35] p-3 text-xs leading-5 text-slate-500">
                  Yêu cầu mật khẩu:
                  <span
                    className={
                      passwordProblems.length ===
                      0 &&
                      registerPassword
                        ? "ml-2 font-black text-emerald-300"
                        : "ml-2"
                    }
                  >
                    tối thiểu 8 ký tự, có chữ và số
                  </span>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={
                      registerRemember
                    }
                    onChange={(
                      event
                    ) =>
                      setRegisterRemember(
                        event.target.checked
                      )
                    }
                  />
                  Đăng nhập và ghi nhớ trên máy này
                </label>

                <button
                  type="submit"
                  disabled={
                    busy
                  }
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3.5 text-sm font-black text-white shadow-lg disabled:opacity-50"
                >
                  {busy
                    ? "Đang tạo tài khoản..."
                    : "Tạo tài khoản"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function WorkspacePanel({
  section,
  onNavigate,
  onOpenMenu,
  aiPreferences,
  onSaveAiPreferences,
  projects,
  currentUser,
}: {
  section: Exclude<StudioSection, "projects">;
  onNavigate: (section: StudioSection) => void;
  onOpenMenu: () => void;
  aiPreferences: AiPreferences;
  onSaveAiPreferences: (next: AiPreferences) => void;
  projects: ProjectLibraryEntry[];
  currentUser: ServerSessionUser | null;
}) {
  if (section === "guide") {
    return (
      <GuidePanel
        onNavigate={onNavigate}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  if (section === "games") {
    return (
      <GamePanel
        onOpenMenu={onOpenMenu}
        projects={projects}
      />
    );
  }

  if (section === "script") {
    return (
      <ScriptPanel
        preferences={aiPreferences}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  if (section === "ai-settings") {
    return (
      <AiSettingsPanel
        preferences={aiPreferences}
        onSave={onSaveAiPreferences}
        onOpenMenu={onOpenMenu}
      />
    );
  }

  if (section === "install") {
    return (
      <StaticInfoPanel
        title="Cài đặt trên PC"
        description="Thông tin vận hành VLearning Studio trên Windows."
        onOpenMenu={onOpenMenu}
      >
        <p>
          Bản hiện tại chạy cục bộ trên máy tính. Khi sử dụng hằng ngày, chạy file <b>START-VLEARNING.cmd</b>.
        </p>
        <div className="mt-5 rounded-xl bg-[#08233f] p-4 font-mono text-xs text-cyan-200">
          C:\Users\Admin\elearning-studio\START-VLEARNING.cmd
        </div>
      </StaticInfoPanel>
    );
  }

  if (section === "language") {
    return (
      <StaticInfoPanel
        title="Ngôn ngữ"
        description="Ngôn ngữ giao diện của phiên bản hiện tại."
        onOpenMenu={onOpenMenu}
      >
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 font-bold text-cyan-100">
          ✓ Tiếng Việt
        </div>
      </StaticInfoPanel>
    );
  }

  if (section === "privacy") {
    return (
      <StaticInfoPanel
        title="Quyền riêng tư"
        description="Cách bản Local xử lý dữ liệu."
        onOpenMenu={onOpenMenu}
      >
        <p>
          Dự án và cài đặt Local được lưu trên máy/trình duyệt. Bộ tạo kịch bản Local không gửi nội dung bài học tới dịch vụ AI bên ngoài.
        </p>
        <p className="mt-4">
          Nên sao lưu dự án quan trọng bằng file .vlearning.zip trước khi xóa dữ liệu trình duyệt hoặc chuyển máy.
        </p>
      </StaticInfoPanel>
    );
  }

  if (section === "terms") {
    return (
      <StaticInfoPanel
        title="Điều khoản sử dụng"
        description="Nguyên tắc sử dụng VLearning Studio Local."
        onOpenMenu={onOpenMenu}
      >
        <p>
          Người dùng chịu trách nhiệm về quyền sử dụng nội dung, hình ảnh, video và tài liệu đưa vào bài giảng.
        </p>
        <p className="mt-4">
          Nên kiểm tra Preview và thử gói SCORM trên LMS trước khi triển khai chính thức.
        </p>
      </StaticInfoPanel>
    );
  }

  if (
    section ===
    "admin-users"
  ) {
    if (
      currentUser?.accessRole !==
      "ADMIN"
    ) {
      return (
        <StaticInfoPanel
          title="Không có quyền"
          description="Khu vực quản trị người dùng chỉ dành cho tài khoản Quản trị viên."
          onOpenMenu={
            onOpenMenu
          }
        >
          <p>
            Tài khoản hiện tại không có quyền xem hoặc thay đổi vai trò của người dùng khác.
          </p>
        </StaticInfoPanel>
      );
    }

    return (
      <AdminUsersPanel
        onOpenMenu={
          onOpenMenu
        }
        currentUserId={
          currentUser.id
        }
      />
    );
  }

  return (
    <AccountPanel
      onOpenMenu={
        onOpenMenu
      }
    />
  );
}

export default function ProjectsPage() {
  const importInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    projects,
    setProjects,
  ] =
    useState<
      ProjectLibraryEntry[]
    >([]);

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    sortMode,
    setSortMode,
  ] =
    useState<SortMode>(
      "updated-desc"
    );

  const [
    duplicatingId,
    setDuplicatingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    thumbnailBusyId,
    setThumbnailBusyId,
  ] =
    useState<string | null>(
      null
    );

  const [
    backupBusyId,
    setBackupBusyId,
  ] =
    useState<string | null>(
      null
    );

  const [
    importing,
    setImporting,
  ] =
    useState(false);

  const [
    thumbnails,
    setThumbnails,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] =
    useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(
        localStorage.getItem(
          "vlearning-ui-sidebar-collapsed-v1"
        ) === "1"
      );
    } catch {
      // localStorage may be unavailable in restrictive environments.
    }
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed(
      (current) => {
        const next =
          !current;

        try {
          localStorage.setItem(
            "vlearning-ui-sidebar-collapsed-v1",
            next
              ? "1"
              : "0"
          );
        } catch {
          // Keep UI working even if persistence fails.
        }

        return next;
      }
    );
  }

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] =
    useState(false);

  const [
    authSession,
    setAuthSession,
  ] =
    useState<ServerSessionUser | null>(
      null
    );

  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);

  const [
    cloudStatus,
    setCloudStatus,
  ] =
    useState<CloudStatus | null>(
      null
    );

  const [
    cloudChecking,
    setCloudChecking,
  ] =
    useState(false);

  const [
    cloudBusy,
    setCloudBusy,
  ] =
    useState(false);

  const [
    cloudMessage,
    setCloudMessage,
  ] =
    useState("");

  useEffect(() => {
    async function refreshAuth() {
      const current =
        await getServerSession();

      setAuthSession(
        current
      );
      setAuthReady(
        true
      );
    }

    void refreshAuth();

    const onAuthChanged =
      () => {
        void refreshAuth();
      };

    window.addEventListener(
      SERVER_AUTH_EVENT,
      onAuthChanged
    );

    return () => {
      window.removeEventListener(
        SERVER_AUTH_EVENT,
        onAuthChanged
      );
    };
  }, []);

  const authorAllowed =
    canAuthor(
      authSession?.accessRole
    );

  const adminAllowed =
    canManageUsers(
      authSession?.accessRole
    );

  async function refreshCloudStatus() {
    if (
      !authSession ||
      !canAuthor(
        authSession.accessRole
      )
    ) {
      setCloudStatus(
        null
      );
      return;
    }

    setCloudChecking(
      true
    );

    try {
      const status =
        await getCloudStatusClient();

      setCloudStatus(
        status
      );
    } catch (
      error
    ) {
      console.error(
        "Không kiểm tra được Cloud:",
        error
      );

      setCloudStatus({
        configured:
          true,
        online:
          false,
        projectCount:
          0,
        ownerUserId:
          authSession.id,
      });
    } finally {
      setCloudChecking(
        false
      );
    }
  }

  useEffect(() => {
    if (
      !authReady ||
      !authorAllowed
    ) {
      return;
    }

    void refreshCloudStatus();
  }, [
    authReady,
    authorAllowed,
    authSession?.id,
  ]);

  async function handlePushProjectsToCloud() {
    if (
      !authSession
    ) {
      window.alert(
        "Hãy đăng nhập trước khi đồng bộ Cloud."
      );
      return;
    }

    syncCurrentProjectToLibrary();

    const localProjects =
      getProjectLibrary();

    if (
      localProjects.length ===
      0
    ) {
      window.alert(
        "Chưa có Project Local để đưa lên Cloud."
      );
      return;
    }

    if (
      !cloudStatus?.online
    ) {
      window.alert(
        "Cloud PostgreSQL chưa sẵn sàng. Hãy chạy SETUP-A17-CLOUD.cmd và kiểm tra kết nối."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Đưa ${localProjects.length} Project Local của tài khoản này lên Cloud?\n\nA17 đồng bộ cấu trúc Project/Pages/Quiz. Video, thumbnail và media vẫn ở Local và sẽ chuyển lên Cloud ở A18.`
      );

    if (
      !confirmed
    ) {
      return;
    }

    setCloudBusy(
      true
    );
    setCloudMessage(
      ""
    );

    try {
      const result =
        await pushCloudProjectsClient(
          localProjects.map(
            (entry) => ({
              projectId:
                entry.project.id,
              title:
                entry.project.title,
              clientUpdatedAt:
                entry.updatedAt,
              snapshot:
                entry.project,
            })
          )
        );

      setCloudMessage(
        `Đã đồng bộ ${result.synced} Project lên Cloud.`
      );

      await refreshCloudStatus();
    } catch (
      error
    ) {
      const message =
        error instanceof
        Error
          ? error.message
          : "Không đồng bộ được Cloud.";

      setCloudMessage(
        `Lỗi: ${message}`
      );

      window.alert(
        message
      );
    } finally {
      setCloudBusy(
        false
      );
    }
  }

  async function handlePullProjectsFromCloud() {
    if (
      !cloudStatus?.online
    ) {
      window.alert(
        "Cloud PostgreSQL chưa sẵn sàng."
      );
      return;
    }

    setCloudBusy(
      true
    );
    setCloudMessage(
      ""
    );

    try {
      const remote =
        await listCloudProjectsClient();

      if (
        remote.length ===
        0
      ) {
        setCloudMessage(
          "Tài khoản này chưa có Project trên Cloud."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Tải ${remote.length} Project từ Cloud về thư viện Local?\n\nNếu Local có cùng Project ID, bản Cloud sẽ ghi đè cấu trúc Project Local. A17 chưa tải video/thumbnail.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      let restored =
        0;

      for (
        const item of
        remote
      ) {
        const record =
          await getCloudProjectClient(
            item.projectId
          );

        saveProjectToLibrary(
          record.snapshot as ProjectLibraryEntry["project"]
        );

        restored +=
          1;
      }

      refreshProjects();

      setCloudMessage(
        `Đã tải ${restored} Project từ Cloud về Local.`
      );
    } catch (
      error
    ) {
      const message =
        error instanceof
        Error
          ? error.message
          : "Không tải được Project Cloud.";

      setCloudMessage(
        `Lỗi: ${message}`
      );

      window.alert(
        message
      );
    } finally {
      setCloudBusy(
        false
      );
    }
  }

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<StudioSection>(
      "projects"
    );

  useEffect(() => {
    if (
      !authReady
    ) {
      return;
    }

    if (
      activeSection ===
        "projects" &&
      !authorAllowed
    ) {
      setActiveSection(
        authSession
          ? "guide"
          : "account"
      );
      return;
    }

    if (
      activeSection ===
        "admin-users" &&
      !adminAllowed
    ) {
      setActiveSection(
        "account"
      );
    }
  }, [
    authReady,
    authSession,
    authorAllowed,
    adminAllowed,
    activeSection,
  ]);

  const [
    aiPreferences,
    setAiPreferences,
  ] =
    useState<AiPreferences>(
      DEFAULT_AI_PREFERENCES
    );

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          "vlearning-ai-settings-v1"
        );

      if (raw) {
        const parsed =
          JSON.parse(
            raw
          ) as Partial<AiPreferences>;

        setAiPreferences({
          ...DEFAULT_AI_PREFERENCES,
          ...parsed,
        });
      }
    } catch {
      // Keep default settings.
    }
  }, []);

  function navigateSection(
    section: StudioSection
  ) {
    const authorSections:
      StudioSection[] =
        [
          "projects",
          "games",
          "script",
          "ai-settings",
        ];

    if (
      authorSections.includes(
        section
      ) &&
      !authorAllowed
    ) {
      setActiveSection(
        authSession
          ? "guide"
          : "account"
      );
      setMobileSidebarOpen(
        false
      );
      return;
    }

    if (
      section ===
        "admin-users" &&
      !adminAllowed
    ) {
      setActiveSection(
        "account"
      );
      setMobileSidebarOpen(
        false
      );
      return;
    }

    if (
      section ===
      "games"
    ) {
      syncCurrentProjectToLibrary();

      setProjects(
        getProjectLibrary()
      );
    }

    setActiveSection(
      section
    );
    setMobileSidebarOpen(
      false
    );
  }

  function saveAiPreferences(
    next: AiPreferences
  ) {
    setAiPreferences(
      next
    );

    try {
      localStorage.setItem(
        "vlearning-ai-settings-v1",
        JSON.stringify(
          next
        )
      );
    } catch {
      // Keep settings for this session if persistence is unavailable.
    }

    window.alert(
      "Đã lưu cài đặt."
    );
  }

  const globalBusy =
    duplicatingId !==
      null ||
    thumbnailBusyId !==
      null ||
    backupBusyId !==
      null ||
    importing ||
    cloudBusy;

  /* =====================================================
     FILTER + SORT
  ===================================================== */

  const visibleProjects =
    useMemo(() => {
      const keyword =
        normalizeText(
          searchQuery
        );

      const filtered =
        keyword
          ? projects.filter(
              (entry) =>
                normalizeText(
                  entry.project.title
                ).includes(
                  keyword
                )
            )
          : [...projects];

      return filtered.sort(
        (a, b) => {
          switch (
            sortMode
          ) {
            case "updated-asc":
              return (
                new Date(
                  a.updatedAt
                ).getTime() -
                new Date(
                  b.updatedAt
                ).getTime()
              );

            case "title-asc":
              return a.project.title.localeCompare(
                b.project.title,
                "vi"
              );

            case "title-desc":
              return b.project.title.localeCompare(
                a.project.title,
                "vi"
              );

            case "updated-desc":
            default:
              return (
                new Date(
                  b.updatedAt
                ).getTime() -
                new Date(
                  a.updatedAt
                ).getTime()
              );
          }
        }
      );
    }, [
      projects,
      searchQuery,
      sortMode,
    ]);

  /* =====================================================
     REFRESH
  ===================================================== */

  function refreshProjects() {
    setProjects(
      getProjectLibrary()
    );
  }

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    syncCurrentProjectToLibrary();

    refreshProjects();
  }, []);

  /* =====================================================
     LOAD THUMBNAILS
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadThumbnails() {
      const result: Record<
        string,
        string
      > = {};

      for (
        const entry of
        projects
      ) {
        try {
          const blob =
            await getProjectThumbnail(
              entry.project.id
            );

          if (
            cancelled
          ) {
            return;
          }

          if (blob) {
            result[
              entry.project.id
            ] =
              await blobToDataUrl(
                blob
              );
          }
        } catch (
          error
        ) {
          console.error(
            `Không tải được thumbnail của ${entry.project.title}:`,
            error
          );
        }
      }

      if (
        !cancelled
      ) {
        setThumbnails(
          result
        );
      }
    }

    void loadThumbnails();

    return () => {
      cancelled =
        true;
    };
  }, [
    projects,
  ]);

  /* =====================================================
     OPEN
  ===================================================== */

  function handleOpen(
    entry:
      ProjectLibraryEntry
  ) {
    setActiveProject(
      entry.project
    );

    logActivity({
      type: "open_project",
      projectId: entry.project.id,
      projectTitle: entry.project.title,
      message: `Đã mở dự án "${entry.project.title}"`,
    });

    window.location.href =
      "/editor/demo";
  }

  /* =====================================================
     CREATE
  ===================================================== */

  function handleCreate() {
    const title =
      window.prompt(
        "Tên bài giảng mới:",
        "Bài giảng mới"
      );

    if (
      title === null
    ) {
      return;
    }

    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      alert(
        "Tên bài giảng không được để trống."
      );

      return;
    }

    createNewProject(
      cleanTitle
    );

    logActivity({
      type: "create_project",
      projectTitle: cleanTitle,
      message: `Đã tạo dự án "${cleanTitle}"`,
    });

    window.location.href =
      "/editor/demo";
  }

  /* =====================================================
     RENAME
  ===================================================== */

  function handleRename(
    entry:
      ProjectLibraryEntry
  ) {
    const newTitle =
      window.prompt(
        "Nhập tên mới cho bài giảng:",
        entry.project.title
      );

    if (
      newTitle === null
    ) {
      return;
    }

    const cleanTitle =
      newTitle.trim();

    if (!cleanTitle) {
      alert(
        "Tên bài giảng không được để trống."
      );

      return;
    }

    if (
      cleanTitle ===
      entry.project.title
    ) {
      return;
    }

    const renamed =
      renameProjectInLibrary(
        entry.project.id,
        cleanTitle
      );

    if (!renamed) {
      alert(
        "Không thể đổi tên dự án."
      );

      return;
    }

    logActivity({
      type: "rename_project",
      projectId: entry.project.id,
      projectTitle: cleanTitle,
      message: `Đã đổi tên dự án "${entry.project.title}" thành "${cleanTitle}"`,
    });

    refreshProjects();
  }

  /* =====================================================
     DUPLICATE
  ===================================================== */

  async function handleDuplicate(
    entry:
      ProjectLibraryEntry
  ) {
    if (
      globalBusy
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Nhân bản dự án "${entry.project.title}"?\n\nTrang, câu hỏi, video, điều kiện hoàn thành và ảnh đại diện sẽ được sao chép.`
      );

    if (!confirmed) {
      return;
    }

    setDuplicatingId(
      entry.project.id
    );

    try {
      const result =
        await duplicateProjectInLibrary(
          entry.project
        );

      logActivity({
        type: "duplicate_project",
        projectId: result.project.id,
        projectTitle: result.project.title,
        message: `Đã nhân bản "${entry.project.title}" thành "${result.project.title}"`,
      });

      refreshProjects();

      if (
        result.missingVideoPages.length >
        0
      ) {
        alert(
          [
            "Đã nhân bản dự án.",
            "",
            `Tên mới: ${result.project.title}`,
            "",
            "Không tìm thấy video của:",
            "",
            ...result.missingVideoPages.map(
              (title) =>
                `• ${title}`
            ),
          ].join("\n")
        );

        return;
      }

      alert(
        [
          "Nhân bản dự án thành công!",
          "",
          `Tên mới: ${result.project.title}`,
        ].join("\n")
      );
    } catch (
      error
    ) {
      console.error(
        "Nhân bản dự án thất bại:",
        error
      );

      alert(
        error instanceof Error
          ? `Không thể nhân bản dự án:\n${error.message}`
          : "Không thể nhân bản dự án."
      );
    } finally {
      setDuplicatingId(
        null
      );
    }
  }

  /* =====================================================
     BACKUP
  ===================================================== */

  async function handleBackup(
    entry:
      ProjectLibraryEntry
  ) {
    if (
      globalBusy
    ) {
      return;
    }

    setBackupBusyId(
      entry.project.id
    );

    try {
      const result =
        await exportProjectBackup(
          entry.project
        );

      logActivity({
        type: "backup_project",
        projectId: entry.project.id,
        projectTitle: entry.project.title,
        message: `Đã sao lưu dự án "${entry.project.title}"`,
      });

      if (
        result.missingVideoPages.length >
        0
      ) {
        alert(
          [
            "Đã tạo file sao lưu.",
            "",
            `File: ${result.fileName}`,
            "",
            "CẢNH BÁO:",
            "Không tìm thấy video của:",
            "",
            ...result.missingVideoPages.map(
              (title) =>
                `• ${title}`
            ),
            "",
            "File backup vẫn được tạo.",
          ].join("\n")
        );

        return;
      }

      alert(
        [
          "Sao lưu dự án thành công!",
          "",
          `File: ${result.fileName}`,
          "",
          "Hãy lưu file này ở nơi an toàn.",
        ].join("\n")
      );
    } catch (
      error
    ) {
      console.error(
        "Sao lưu dự án thất bại:",
        error
      );

      alert(
        error instanceof Error
          ? `Không thể sao lưu dự án:\n${error.message}`
          : "Không thể sao lưu dự án."
      );
    } finally {
      setBackupBusyId(
        null
      );
    }
  }

  /* =====================================================
     IMPORT BACKUP
  ===================================================== */

  async function handleImportBackup(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const input =
      event.currentTarget;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(
          ".zip"
        )
    ) {
      alert(
        "Vui lòng chọn file .vlearning.zip hoặc .zip."
      );

      input.value =
        "";

      return;
    }

    setImporting(
      true
    );

    try {
      const result =
        await importProjectBackup(
          file
        );

      logActivity({
        type: "restore_project",
        projectId: result.project.id,
        projectTitle: result.project.title,
        message: `Đã khôi phục dự án "${result.project.title}" từ file backup`,
      });

      refreshProjects();

      if (
        result.warnings.length >
        0
      ) {
        alert(
          [
            "Đã nhập dự án.",
            "",
            `Tên: ${result.project.title}`,
            "",
            "Một số thành phần có cảnh báo:",
            "",
            ...result.warnings.map(
              (warning) =>
                `• ${warning}`
            ),
          ].join("\n")
        );

        return;
      }

      alert(
        [
          "Khôi phục dự án thành công!",
          "",
          `Tên: ${result.project.title}`,
          "",
          "Trang, quiz, video, điều kiện hoàn thành và ảnh đại diện đã được khôi phục.",
        ].join("\n")
      );
    } catch (
      error
    ) {
      console.error(
        "Nhập file backup thất bại:",
        error
      );

      alert(
        error instanceof Error
          ? `Không thể nhập dự án:\n${error.message}`
          : "Không thể nhập dự án."
      );
    } finally {
      input.value =
        "";

      setImporting(
        false
      );
    }
  }

  /* =====================================================
     DELETE PROJECT
  ===================================================== */

  function handleDelete(
    entry:
      ProjectLibraryEntry
  ) {
    if (
      globalBusy
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          `Bạn có chắc muốn xóa dự án "${entry.project.title}"?`,
          "",
          "Thao tác này sẽ xóa:",
          "• Dự án",
          "• Video",
          "• Điều kiện hoàn thành",
          "• Ảnh đại diện",
          "",
          "Không thể hoàn tác.",
        ].join("\n")
      );

    if (!confirmed) {
      return;
    }

    deleteProjectFromLibrary(
      entry.project.id
    );

    logActivity({
      type: "delete_project",
      projectId: entry.project.id,
      projectTitle: entry.project.title,
      message: `Đã xóa dự án "${entry.project.title}"`,
    });

    refreshProjects();
  }

  /* =====================================================
     THUMBNAIL
  ===================================================== */

  async function handleThumbnailChange(
    entry:
      ProjectLibraryEntry,
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const input =
      event.currentTarget;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Vui lòng chọn file ảnh."
      );

      input.value =
        "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Ảnh đại diện tối đa 5 MB."
      );

      input.value =
        "";

      return;
    }

    setThumbnailBusyId(
      entry.project.id
    );

    try {
      await saveProjectThumbnail(
        entry.project.id,
        file
      );

      const dataUrl =
        await blobToDataUrl(
          file
        );

      setThumbnails(
        (current) => ({
          ...current,

          [entry.project.id]:
            dataUrl,
        })
      );

      saveProjectToLibrary(
        entry.project
      );

      refreshProjects();
    } catch (
      error
    ) {
      console.error(
        "Không lưu được ảnh đại diện:",
        error
      );

      alert(
        "Không thể lưu ảnh đại diện."
      );
    } finally {
      input.value =
        "";

      setThumbnailBusyId(
        null
      );
    }
  }

  async function handleDeleteThumbnail(
    entry:
      ProjectLibraryEntry
  ) {
    if (
      globalBusy
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Xóa ảnh đại diện của "${entry.project.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setThumbnailBusyId(
      entry.project.id
    );

    try {
      await deleteProjectThumbnail(
        entry.project.id
      );

      setThumbnails(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            entry.project.id
          ];

          return next;
        }
      );

      saveProjectToLibrary(
        entry.project
      );

      refreshProjects();
    } catch (
      error
    ) {
      console.error(
        "Không xóa được ảnh đại diện:",
        error
      );

      alert(
        "Không thể xóa ảnh đại diện."
      );
    } finally {
      setThumbnailBusyId(
        null
      );
    }
  }

  /* =====================================================
     UI - V1.1A3 SIMPLE REFERENCE HOME
  ===================================================== */

  return (
    <main className="min-h-screen bg-[#031426] text-white">

      <LeftSidebar
        active={
          activeSection
        }
        onNavigate={
          navigateSection
        }
        collapsed={
          sidebarCollapsed
        }
        onToggle={
          toggleSidebar
        }
        mobileOpen={
          mobileSidebarOpen
        }
        currentUser={
          authSession
        }
        onMobileClose={() =>
          setMobileSidebarOpen(
            false
          )
        }
      />

      <div
        className={`transition-[padding] duration-300 ${
          sidebarCollapsed
            ? "xl:pl-[78px]"
            : "xl:pl-[224px]"
        }`}
      >

        <div className="mx-auto w-full max-w-[1280px] px-3 py-2 sm:px-4 lg:px-4 xl:px-5">

          <input
            ref={
              importInputRef
            }
            type="file"
            accept=".zip,.vlearning.zip,application/zip"
            className="hidden"
            onChange={
              handleImportBackup
            }
          />

          {!authReady && (
            <div className="rounded-[24px] border border-blue-800/70 bg-[#0c2b50] p-8 text-center text-sm text-slate-400">
              Đang kiểm tra quyền truy cập...
            </div>
          )}

          {authReady &&
            activeSection ===
              "projects" &&
            !authorAllowed && (
            <div className="rounded-[24px] border border-amber-500/30 bg-amber-500/5 p-8">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-amber-300">
                Quyền truy cập
              </div>
              <h2 className="mt-2 text-2xl font-black">
                Khu vực biên soạn dành cho Giáo viên và Quản trị viên
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Tài khoản Học viên không được tạo, sửa hoặc xuất bài giảng. Hãy dùng tài khoản Giáo viên/Quản trị viên hoặc liên hệ quản trị hệ thống để được cấp quyền.
              </p>
            </div>
          )}

          {authReady &&
            activeSection !==
              "projects" && (
            <WorkspacePanel
              section={activeSection}
              onNavigate={navigateSection}
              onOpenMenu={() =>
                setMobileSidebarOpen(
                  true
                )
              }
              aiPreferences={aiPreferences}
              onSaveAiPreferences={saveAiPreferences}
              projects={projects}
              currentUser={authSession}
            />
          )}

          <div
            className={
              activeSection === "projects" &&
              authorAllowed
                ? "block"
                : "hidden"
            }
          >


          {/* Mobile compact header */}

          <div className="mb-3 flex items-center justify-between gap-3 xl:hidden">

            <div className="flex min-w-0 items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(
                    true
                  )
                }
                aria-label="Mở menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/25 bg-[#0b2a4c] text-cyan-300 transition hover:bg-cyan-500/10"
              >
                <Menu
                  size={21}
                />
              </button>

              <div className="min-w-0">
                <div className="truncate text-lg font-black text-cyan-300 sm:text-xl">
                  VLEARNING STUDIO
                </div>
                <div className="mt-1 truncate text-[10px] text-slate-400 sm:text-[11px]">
                  Bài giảng tương tác • SCORM
                </div>
              </div>

            </div>

            <button
              type="button"
              onClick={
                handleCreate
              }
              disabled={
                globalBusy
              }
              className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-2.5 text-xs font-black shadow-lg disabled:opacity-50"
            >
              <Plus
                size={16}
              />
              <span className="hidden sm:inline">
                Tạo mới
              </span>
            </button>

          </div>

          {/* =================================================
              A16.10 ONE SCREEN DASHBOARD
          ================================================= */}

          <section className="relative overflow-hidden rounded-[16px] border border-cyan-400/20 bg-gradient-to-r from-[#10365f] via-[#193f73] to-[#23396b] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex h-[76px] items-center justify-between gap-4 px-4 sm:px-5">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-300">
                  <BookOpen size={19} />
                </div>

                <div className="min-w-0">

                  <div className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan-300/75">
                    E-learning Authoring Platform
                  </div>

                  <div className="flex min-w-0 items-baseline gap-3">
                    <h1 className="whitespace-nowrap text-[24px] font-black leading-none tracking-tight sm:text-[27px] lg:text-[30px]">
                      VLEARNING STUDIO
                    </h1>

                    <p className="hidden truncate text-[10px] text-slate-300 lg:block xl:text-[11px]">
                      Bài giảng tương tác • Game học tập • SCORM 1.2
                    </p>
                  </div>

                </div>

              </div>

              <img
                src="/vlearning-ui/hero-learning.png"
                alt="VLearning Studio"
                className="hidden h-[60px] w-[170px] shrink-0 object-contain object-right drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)] md:block"
              />

            </div>

          </section>

          <section className="mt-2.5">

            <div className="mb-2 flex items-center justify-between gap-3">

              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-cyan-400" />
                <h2 className="text-sm font-black tracking-tight">
                  TẠO MỚI DỰ ÁN
                </h2>
              </div>

              <div className="hidden text-[9px] text-slate-500 sm:block">
                2 công cụ chính
              </div>

            </div>

            <div className="grid gap-2.5 md:grid-cols-2">

              <button
                type="button"
                onClick={handleCreate}
                disabled={globalBusy}
                className="group relative h-[122px] overflow-hidden rounded-[16px] border border-blue-400/40 bg-gradient-to-br from-[#143e78] via-[#31347c] to-[#542d68] p-3.5 text-left shadow-[0_10px_26px_rgba(16,42,95,0.25)] transition hover:-translate-y-0.5 hover:border-cyan-300/65 disabled:opacity-50"
              >

                <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />

                <div className="relative z-10 flex h-full items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-100">
                      <Play size={24} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[8px] font-black uppercase tracking-[0.12em] text-cyan-200/80">
                        Bài giảng tương tác
                      </div>

                      <h3 className="mt-1 whitespace-nowrap text-[20px] font-black leading-none tracking-tight">
                        BÀI GIẢNG <span className="text-cyan-300">TƯƠNG TÁC</span>
                      </h3>

                      <div className="mt-2 text-[9px] font-bold text-blue-100/65">
                        Video • 7 dạng Quiz • Preview • SCORM
                      </div>
                    </div>

                  </div>

                  <img
                    src="/vlearning-ui/lesson-visual.png"
                    alt="Bài giảng tương tác"
                    className="hidden max-h-[96px] w-[150px] shrink-0 object-contain object-right drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)] sm:block lg:w-[180px]"
                  />

                  <span className="absolute right-2.5 top-2.5 rounded-full bg-white px-2 py-1 text-[8px] font-black text-slate-900">
                    TẠO ›
                  </span>

                </div>

              </button>

              <button
                type="button"
                onClick={() =>
                  navigateSection(
                    "games"
                  )
                }
                className="group relative h-[122px] overflow-hidden rounded-[16px] border border-amber-400/40 bg-gradient-to-br from-[#674018] via-[#73332d] to-[#6c254d] p-3.5 text-left shadow-[0_10px_26px_rgba(91,39,35,0.22)] transition hover:-translate-y-0.5 hover:border-amber-300/65"
              >

                <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />

                <div className="relative z-10 flex h-full items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-400/10 text-amber-100">
                      <Gamepad2 size={25} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[8px] font-black uppercase tracking-[0.12em] text-amber-200/80">
                        Gamification
                      </div>

                      <h3 className="mt-1 whitespace-nowrap text-[20px] font-black leading-none tracking-tight">
                        TRÒ CHƠI <span className="text-amber-300">TƯƠNG TÁC</span>
                      </h3>

                      <div className="mt-2 text-[9px] font-bold text-orange-50/65">
                        Tạo Game • Chơi thử • Gắn vào Page
                      </div>
                    </div>

                  </div>

                  <img
                    src="/vlearning-ui/game-visual.png"
                    alt="Trò chơi tương tác"
                    className="hidden max-h-[96px] w-[150px] shrink-0 object-contain object-right drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)] sm:block lg:w-[180px]"
                  />

                  <span className="absolute right-2.5 top-2.5 rounded-full bg-white px-2 py-1 text-[8px] font-black text-slate-900">
                    MỞ ›
                  </span>

                </div>

              </button>

            </div>

          </section>

          {/* =================================================
              PROJECT LIBRARY
          ================================================= */}

          <section className="mt-2.5 pb-5">

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">
                <BookOpen
                  size={18}
                  className="text-cyan-300"
                />
                <h2 className="text-base font-black">
                  Bài giảng mới nhất
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    importInputRef.current?.click()
                  }
                  disabled={
                    globalBusy
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-700/70 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-blue-600/80 disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload
                      size={15}
                    />
                  )}
                  {importing
                    ? "Đang nhập..."
                    : "Nhập dự án"}
                </button>

                <a
                  href="#all-projects"
                  className="flex items-center gap-1 rounded-lg border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-xs font-black text-cyan-300"
                >
                  XEM TẤT CẢ
                  <ChevronRight
                    size={14}
                  />
                </a>

              </div>

            </div>

            {/* A17 CLOUD DATA FOUNDATION */}
            <div className="mt-3 rounded-[16px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 p-3">

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex min-w-0 items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                    <Cloud
                      size={19}
                    />
                  </div>

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <div className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
                        A17 Cloud Project
                      </div>

                      {cloudChecking ? (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-black text-slate-400">
                          ĐANG KIỂM TRA...
                        </span>
                      ) : !cloudStatus?.configured ? (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[9px] font-black text-amber-300">
                          CHƯA CẤU HÌNH
                        </span>
                      ) : cloudStatus.online ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black text-emerald-300">
                          CLOUD ONLINE
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[9px] font-black text-red-300">
                          MẤT KẾT NỐI
                        </span>
                      )}

                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-slate-400">
                      {cloudStatus?.online
                        ? `${cloudStatus.projectCount} Project của tài khoản này đang có trên PostgreSQL Cloud.`
                        : "Cấu hình PostgreSQL để đồng bộ Project theo tài khoản và mở lại trên máy khác."}
                    </div>

                    <div className="mt-1 text-[9px] leading-4 text-slate-600">
                      A17 đồng bộ cấu trúc Project, Page, Quiz và thiết lập. Video/thumbnail/media vẫn Local; A18 sẽ chuyển media lên Cloud Storage.
                    </div>

                    {cloudMessage && (
                      <div className={`mt-2 text-[10px] font-bold ${
                        cloudMessage.startsWith(
                          "Lỗi:"
                        )
                          ? "text-red-300"
                          : "text-emerald-300"
                      }`}>
                        {cloudMessage}
                      </div>
                    )}

                  </div>

                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      void refreshCloudStatus()
                    }
                    disabled={
                      cloudChecking ||
                      cloudBusy ||
                      !authSession
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800 bg-[#08233f] text-slate-300 transition hover:text-white disabled:opacity-40"
                    title="Kiểm tra Cloud"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        cloudChecking
                          ? "animate-spin"
                          : ""
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handlePushProjectsToCloud()
                    }
                    disabled={
                      cloudBusy ||
                      !cloudStatus?.online ||
                      projects.length ===
                        0
                    }
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-cyan-500 disabled:opacity-40"
                  >
                    {cloudBusy ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <CloudUpload
                        size={14}
                      />
                    )}
                    ĐẨY LÊN CLOUD
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handlePullProjectsFromCloud()
                    }
                    disabled={
                      cloudBusy ||
                      !cloudStatus?.online ||
                      !cloudStatus.projectCount
                    }
                    className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-[10px] font-black text-purple-200 transition hover:bg-purple-500/20 disabled:opacity-40"
                  >
                    <CloudDownload
                      size={14}
                    />
                    TẢI TỪ CLOUD
                  </button>

                </div>

              </div>

            </div>

            {projects.length >
              0 && (

              <div
                id="all-projects"
                className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
              >

                <div className="relative w-full lg:max-w-md">

                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={
                      searchQuery
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Tìm kiếm bài giảng..."
                    className="w-full rounded-xl border border-blue-800/80 bg-[#0b2a4c] py-3 pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchQuery(
                          ""
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
                    >
                      <X
                        size={15}
                      />
                    </button>
                  )}

                </div>

                <div className="flex items-center gap-2">

                  <select
                    value={
                      sortMode
                    }
                    onChange={(
                      event
                    ) =>
                      setSortMode(
                        event.target.value as SortMode
                      )
                    }
                    className="rounded-xl border border-blue-800/80 bg-[#0b2a4c] px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-500"
                  >
                    <option value="updated-desc">
                      Mới cập nhật
                    </option>
                    <option value="updated-asc">
                      Cũ nhất
                    </option>
                    <option value="title-asc">
                      Tên A → Z
                    </option>
                    <option value="title-desc">
                      Tên Z → A
                    </option>
                  </select>

                  <div className="rounded-xl bg-[#0b2a4c] px-4 py-3 text-xs font-bold text-slate-400">
                    {visibleProjects.length} dự án
                  </div>

                </div>

              </div>

            )}

            {projects.length ===
            0 ? (

              <div className="mt-6 rounded-[24px] border border-dashed border-blue-700/60 bg-[#0b2a4c] p-12 text-center">

                <FolderOpen
                  size={48}
                  className="mx-auto text-cyan-300"
                />

                <h3 className="mt-4 text-2xl font-black">
                  Chưa có bài giảng
                </h3>

                <p className="mt-2 text-slate-400">
                  Tạo bài giảng đầu tiên hoặc nhập dự án đã sao lưu.
                </p>

              </div>

            ) : visibleProjects.length ===
              0 ? (

              <div className="mt-6 rounded-[24px] border border-dashed border-blue-700/60 bg-[#0b2a4c] p-12 text-center">
                <Search
                  size={44}
                  className="mx-auto text-cyan-300"
                />
                <h3 className="mt-4 text-xl font-black">
                  Không tìm thấy bài giảng
                </h3>
              </div>

            ) : (

              <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">

                {visibleProjects.map(
                  (entry) => {
                    const project =
                      entry.project;

                    const quizCount =
                      getProjectQuizCount(
                        project
                      );

                    const thumbnail =
                      thumbnails[
                        project.id
                      ];

                    const isDuplicating =
                      duplicatingId ===
                      project.id;

                    const isThumbnailBusy =
                      thumbnailBusyId ===
                      project.id;

                    const isBackupBusy =
                      backupBusyId ===
                      project.id;

                    return (
                      <article
                        key={
                          project.id
                        }
                        className="group overflow-hidden rounded-[20px] border border-blue-800/70 bg-[#0d315a] shadow-[0_14px_45px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-cyan-500/50"
                      >

                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1b4b8a] via-[#20447d] to-[#17335f]">

                          {thumbnail ? (
                            <img
                              src={
                                thumbnail
                              }
                              alt={`Ảnh đại diện ${project.title}`}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Play
                                size={42}
                                className="text-white/15"
                              />
                            </div>
                          )}

                          <div className="absolute left-4 top-4 rounded-lg border border-cyan-300/30 bg-sky-500/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-cyan-200 backdrop-blur">
                            {project.pages.length} TRANG
                          </div>

                          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 pt-12">

                            <input
                              id={`thumbnail-${project.id}`}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              disabled={
                                globalBusy
                              }
                              onChange={(
                                event
                              ) =>
                                void handleThumbnailChange(
                                  entry,
                                  event
                                )
                              }
                            />

                            <label
                              htmlFor={`thumbnail-${project.id}`}
                              className={`flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/55 px-3 py-2 text-[11px] font-black backdrop-blur transition hover:bg-black/75 ${
                                globalBusy
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }`}
                            >
                              {isThumbnailBusy ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <ImagePlus
                                  size={13}
                                />
                              )}
                              {thumbnail
                                ? "Đổi ảnh"
                                : "Thêm ảnh"}
                            </label>

                            {thumbnail && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteThumbnail(
                                    entry
                                  )
                                }
                                disabled={
                                  globalBusy
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-950/75 text-red-200 backdrop-blur hover:bg-red-900 disabled:opacity-50"
                              >
                                <ImageOff
                                  size={14}
                                />
                              </button>
                            )}

                          </div>

                        </div>

                        <div className="p-5">

                          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300">
                            Bài giảng
                          </div>

                          <h3 className="mt-2 line-clamp-2 min-h-[52px] text-xl font-black leading-snug">
                            {project.title}
                          </h3>

                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <div className="rounded-xl bg-[#0a294b] p-3">
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                                <Layers3
                                  size={13}
                                />
                                Số trang
                              </div>
                              <div className="mt-1 text-xl font-black text-cyan-300">
                                {project.pages.length}
                              </div>
                            </div>

                            <div className="rounded-xl bg-[#0a294b] p-3">
                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                                <FileQuestion
                                  size={13}
                                />
                                Câu hỏi
                              </div>
                              <div className="mt-1 text-xl font-black text-fuchsia-300">
                                {quizCount}
                              </div>
                            </div>

                          </div>

                          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                            <Clock3
                              size={13}
                            />
                            Cập nhật:{" "}
                            {formatUpdatedAt(
                              entry.updatedAt
                            )}
                          </div>

                          <div className="mt-5 flex items-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleOpen(
                                  entry
                                )
                              }
                              disabled={
                                globalBusy
                              }
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black transition hover:bg-blue-500 disabled:opacity-50"
                            >
                              <FolderOpen
                                size={17}
                              />
                              Mở dự án
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDuplicate(
                                  entry
                                )
                              }
                              disabled={
                                globalBusy
                              }
                              title="Nhân bản"
                              className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-950/60 text-purple-200 transition hover:bg-purple-900 disabled:opacity-50"
                            >
                              {isDuplicating ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Copy
                                  size={17}
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleBackup(
                                  entry
                                )
                              }
                              disabled={
                                globalBusy
                              }
                              title="Sao lưu"
                              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-200 transition hover:bg-emerald-900 disabled:opacity-50"
                            >
                              {isBackupBusy ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Download
                                  size={17}
                                />
                              )}
                            </button>

                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleRename(
                                  entry
                                )
                              }
                              disabled={
                                globalBusy
                              }
                              className="flex items-center justify-center gap-2 rounded-xl border border-blue-800 bg-[#12365f] px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50"
                            >
                              <Pencil
                                size={14}
                              />
                              Đổi tên
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  entry
                                )
                              }
                              disabled={
                                globalBusy
                              }
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-900 bg-red-950/25 px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-950/50 disabled:opacity-50"
                            >
                              <Trash2
                                size={14}
                              />
                              Xóa
                            </button>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </section>

          </div>

        </div>

      </div>

    </main>
  );
}
