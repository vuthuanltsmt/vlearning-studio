"use client";

import {
  create,
} from "zustand";

import type {
  LessonPage,
  ProjectDocument,
  Quiz,
} from "@/types/lesson";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
  "vlearning-studio-project-v4";

const HISTORY_LIMIT =
  50;

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

  return `id-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =========================================================
   CREATE PAGE
========================================================= */

function createNewPage(
  pageNumber: number
): LessonPage {
  return {
    id:
      createId(),

    title:
      `Trang ${pageNumber}`,

    videoName:
      "",

    videoUrl:
      undefined,

    duration:
      10,

    quizzes:
      [],
  };
}

/* =========================================================
   CLONE PROJECT

   History chỉ tồn tại trong RAM.
   Giữ videoUrl để Undo/Redo không làm
   mất video đang hiển thị trong Editor.
========================================================= */

function cloneProject(
  project: ProjectDocument
): ProjectDocument {
  return {
    ...project,

    pages:
      project.pages.map(
        (page) => ({
          ...page,

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
   PROJECT FOR LOCAL STORAGE

   blob URL không tồn tại sau reload,
   vì vậy không lưu videoUrl.
========================================================= */

function createPersistableProject(
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
   INITIAL PAGE
========================================================= */

const firstPage:
  LessonPage = {
    id:
      "page-1",

    title:
      "Trang 1",

    videoName:
      "",

    videoUrl:
      undefined,

    duration:
      10,

    quizzes:
      [],
  };

/* =========================================================
   INITIAL PROJECT
========================================================= */

const initialProject:
  ProjectDocument = {
    id:
      "demo-project",

    title:
      "Bài giảng tương tác đầu tiên",

    selectedPageId:
      firstPage.id,

    pages: [
      firstPage,
    ],
  };

/* =========================================================
   STORE TYPE
========================================================= */

type EditorStore = {
  project:
    ProjectDocument;

  saveStatus:
    string;

  hydrated:
    boolean;

  /*
   * V10.10
   */
  past:
    ProjectDocument[];

  future:
    ProjectDocument[];

  /* PROJECT */

  hydrate:
    () => void;

  saveProject:
    () => void;

  undo:
    () => void;

  redo:
    () => void;

  /* PAGE */

  selectPage:
    (
      pageId: string
    ) => void;

  addPage:
    () => void;

  renamePage:
    (
      pageId: string,
      title: string
    ) => void;

  duplicatePage:
    (
      pageId: string
    ) => void;

  deletePage:
    (
      pageId: string
    ) => void;

  /* TEACHER NARRATION */
  setPageNarration: (pageId: string, narration: string) => void;
  setPageNarrationOverlay: (pageId: string, enabled: boolean, start: number, end: number) => void;

  /* VIDEO */

  setPageVideo:
    (
      pageId: string,
      videoUrl: string,
      videoName: string
    ) => void;

  setPageDuration:
    (
      pageId: string,
      duration: number
    ) => void;

  /* QUIZ */

  addQuiz:
    (
      pageId: string,
      quiz: Quiz
    ) => void;

  updateQuiz:
    (
      pageId: string,
      quizId: string,
      quiz: Quiz
    ) => void;

  duplicateQuiz:
    (
      pageId: string,
      quizId: string
    ) => void;

  deleteQuiz:
    (
      pageId: string,
      quizId: string
    ) => void;
};

/* =========================================================
   STORE
========================================================= */

export const useEditorStore =
  create<EditorStore>(
    (
      set,
      get
    ) => {
      /* =====================================================
         COMMIT EDIT

         Mọi chỉnh sửa nội dung thật đều đi qua đây:
         - lưu snapshot hiện tại vào past
         - xóa future
         - đánh dấu chưa lưu
      ===================================================== */

      function commitProject(
        updater:
          (
            project:
              ProjectDocument
          ) =>
            ProjectDocument
      ) {
        const state =
          get();

        const previous =
          cloneProject(
            state.project
          );

        const nextProject =
          updater(
            state.project
          );

        const nextPast =
          [
            ...state.past,
            previous,
          ].slice(
            -HISTORY_LIMIT
          );

        set({
          project:
            nextProject,

          past:
            nextPast,

          future:
            [],

          saveStatus:
            "Có thay đổi chưa lưu",
        });
      }

      return {
        project:
          initialProject,

        saveStatus:
          "Chưa lưu",

        hydrated:
          false,

        past:
          [],

        future:
          [],

        /* =====================================================
           LOAD PROJECT
        ===================================================== */

        hydrate:
          () => {
            if (
              get().hydrated
            ) {
              return;
            }

            try {
              const saved =
                localStorage.getItem(
                  STORAGE_KEY
                );

              if (!saved) {
                set({
                  hydrated:
                    true,

                  past:
                    [],

                  future:
                    [],
                });

                return;
              }

              const data =
                JSON.parse(
                  saved
                ) as ProjectDocument;

              if (
                !data ||
                !Array.isArray(
                  data.pages
                ) ||
                data.pages.length ===
                  0
              ) {
                set({
                  hydrated:
                    true,

                  past:
                    [],

                  future:
                    [],
                });

                return;
              }

              /*
               * blob URL không tồn tại
               * sau reload.
               */
              const pages =
                data.pages.map(
                  (page) => ({
                    ...page,

                    videoUrl:
                      undefined,

                    quizzes:
                      page.quizzes.map(
                        (
                          quiz
                        ) => ({
                          ...quiz,

                          options:
                            [
                              ...quiz.options,
                            ],
                        })
                      ),
                  })
                );

              let selectedPageId =
                data.selectedPageId;

              const selectedExists =
                pages.some(
                  (page) =>
                    page.id ===
                    selectedPageId
                );

              if (
                !selectedExists
              ) {
                selectedPageId =
                  pages[0].id;
              }

              set({
                project: {
                  ...data,

                  pages,

                  selectedPageId,
                },

                hydrated:
                  true,

                past:
                  [],

                future:
                  [],

                saveStatus:
                  "Đã tải dự án",
              });
            } catch (
              error
            ) {
              console.error(
                "Lỗi tải dự án:",
                error
              );

              set({
                hydrated:
                  true,

                past:
                  [],

                future:
                  [],

                saveStatus:
                  "Không đọc được dự án",
              });
            }
          },

        /* =====================================================
           SAVE PROJECT
        ===================================================== */

        saveProject:
          () => {
            const project =
              get().project;

            const data =
              createPersistableProject(
                project
              );

            try {
              localStorage.setItem(
                STORAGE_KEY,

                JSON.stringify(
                  data
                )
              );

              set({
                saveStatus:
                  `Đã lưu lúc ${new Date().toLocaleTimeString(
                    "vi-VN"
                  )}`,
              });
            } catch (
              error
            ) {
              console.error(
                "Lỗi lưu dự án:",
                error
              );

              set({
                saveStatus:
                  "Lưu thất bại",
              });
            }
          },

        /* =====================================================
           UNDO
        ===================================================== */

        undo:
          () => {
            const state =
              get();

            if (
              state.past.length ===
              0
            ) {
              return;
            }

            const previous =
              state.past[
                state.past.length -
                  1
              ];

            const currentSnapshot =
              cloneProject(
                state.project
              );

            const nextFuture =
              [
                currentSnapshot,
                ...state.future,
              ].slice(
                0,
                HISTORY_LIMIT
              );

            set({
              project:
                cloneProject(
                  previous
                ),

              past:
                state.past.slice(
                  0,
                  -1
                ),

              future:
                nextFuture,

              saveStatus:
                "Có thay đổi chưa lưu",
            });
          },

        /* =====================================================
           REDO
        ===================================================== */

        redo:
          () => {
            const state =
              get();

            if (
              state.future.length ===
              0
            ) {
              return;
            }

            const nextProject =
              state.future[0];

            const currentSnapshot =
              cloneProject(
                state.project
              );

            const nextPast =
              [
                ...state.past,
                currentSnapshot,
              ].slice(
                -HISTORY_LIMIT
              );

            set({
              project:
                cloneProject(
                  nextProject
                ),

              past:
                nextPast,

              future:
                state.future.slice(
                  1
                ),

              saveStatus:
                "Có thay đổi chưa lưu",
            });
          },

        /* =====================================================
           SELECT PAGE

           Chọn trang không tạo History.
        ===================================================== */

        selectPage:
          (
            pageId
          ) => {
            set(
              (
                state
              ) => ({
                project: {
                  ...state.project,

                  selectedPageId:
                    pageId,
                },
              })
            );
          },

        /* =====================================================
           ADD PAGE
        ===================================================== */

        addPage:
          () => {
            const state =
              get();

            const newPage =
              createNewPage(
                state.project.pages.length +
                  1
              );

            commitProject(
              (
                project
              ) => ({
                ...project,

                pages: [
                  ...project.pages,
                  newPage,
                ],

                selectedPageId:
                  newPage.id,
              })
            );
          },

        /* =====================================================
           RENAME PAGE
        ===================================================== */

        renamePage:
          (
            pageId,
            title
          ) => {
            commitProject(
              (
                project
              ) => ({
                ...project,

                pages:
                  project.pages.map(
                    (
                      page
                    ) =>
                      page.id ===
                      pageId
                        ? {
                            ...page,

                            title,
                          }
                        : page
                  ),
              })
            );
          },

        setPageNarration: (pageId, narration) => {
          commitProject((project) => ({
            ...project,
            pages: project.pages.map((page) => page.id === pageId ? {...page, teacherNarration: narration} : page),
          }));
        },

        setPageNarrationOverlay: (pageId, enabled, start, end) => {
          commitProject(project => ({...project, pages: project.pages.map(page => page.id === pageId ? {...page, narrationOverlayEnabled: enabled, narrationStart: Math.max(0,start), narrationEnd: Math.max(0,end)} : page)}));
        },

        /* =====================================================
           DUPLICATE PAGE
        ===================================================== */

        duplicatePage:
          (
            pageId
          ) => {
            const state =
              get();

            const source =
              state.project.pages.find(
                (
                  page
                ) =>
                  page.id ===
                  pageId
              );

            if (!source) {
              return;
            }

            const copy:
              LessonPage = {
                ...source,

                id:
                  createId(),

                title:
                  `${source.title} - Bản sao`,

                quizzes:
                  source.quizzes.map(
                    (
                      quiz
                    ) => ({
                      ...quiz,

                      id:
                        createId(),

                      options:
                        [
                          ...quiz.options,
                        ],
                    })
                  ),
              };

            commitProject(
              (
                project
              ) => ({
                ...project,

                pages: [
                  ...project.pages,
                  copy,
                ],

                selectedPageId:
                  copy.id,
              })
            );
          },

        /* =====================================================
           DELETE PAGE
        ===================================================== */

        deletePage:
          (
            pageId
          ) => {
            const state =
              get();

            if (
              state.project.pages.length <=
              1
            ) {
              alert(
                "Dự án phải có ít nhất 1 trang."
              );

              return;
            }

            const deletedIndex =
              state.project.pages.findIndex(
                (
                  page
                ) =>
                  page.id ===
                  pageId
              );

            const pages =
              state.project.pages.filter(
                (
                  page
                ) =>
                  page.id !==
                  pageId
              );

            let selectedPageId =
              state.project.selectedPageId;

            if (
              selectedPageId ===
              pageId
            ) {
              const nextIndex =
                Math.min(
                  deletedIndex,
                  pages.length -
                    1
                );

              selectedPageId =
                pages[
                  Math.max(
                    0,
                    nextIndex
                  )
                ].id;
            }

            commitProject(
              (
                project
              ) => ({
                ...project,

                pages,

                selectedPageId,
              })
            );
          },

        /* =====================================================
           SET VIDEO
        ===================================================== */

        setPageVideo:
          (
            pageId,
            videoUrl,
            videoName
          ) => {
            commitProject(
              (
                project
              ) => ({
                ...project,

                pages:
                  project.pages.map(
                    (
                      page
                    ) =>
                      page.id ===
                      pageId
                        ? {
                            ...page,

                            videoUrl,

                            videoName,
                          }
                        : page
                  ),
              })
            );
          },

        /* =====================================================
           SET VIDEO DURATION

           Metadata kỹ thuật không tạo History.
        ===================================================== */

        setPageDuration:
          (
            pageId,
            duration
          ) => {
            set(
              (
                state
              ) => ({
                project: {
                  ...state.project,

                  pages:
                    state.project.pages.map(
                      (
                        page
                      ) =>
                        page.id ===
                        pageId
                          ? {
                              ...page,

                              duration,
                            }
                          : page
                    ),
                },
              })
            );
          },

        /* =====================================================
           ADD QUIZ
        ===================================================== */

        addQuiz:
          (
            pageId,
            quiz
          ) => {
            commitProject(
              (
                project
              ) => ({
                ...project,

                pages:
                  project.pages.map(
                    (
                      page
                    ) => {
                      if (
                        page.id !==
                        pageId
                      ) {
                        return page;
                      }

                      const quizzes =
                        [
                          ...page.quizzes,
                          quiz,
                        ].sort(
                          (
                            a,
                            b
                          ) =>
                            a.time -
                            b.time
                        );

                      return {
                        ...page,

                        quizzes,
                      };
                    }
                  ),
              })
            );
          },

        /* =====================================================
           UPDATE QUIZ
        ===================================================== */

        updateQuiz:
          (
            pageId,
            quizId,
            quiz
          ) => {
            commitProject(
              (
                project
              ) => ({
                ...project,

                pages:
                  project.pages.map(
                    (
                      page
                    ) => {
                      if (
                        page.id !==
                        pageId
                      ) {
                        return page;
                      }

                      const quizzes =
                        page.quizzes
                          .map(
                            (
                              oldQuiz
                            ) =>
                              oldQuiz.id ===
                              quizId
                                ? quiz
                                : oldQuiz
                          )
                          .sort(
                            (
                              a,
                              b
                            ) =>
                              a.time -
                              b.time
                          );

                      return {
                        ...page,

                        quizzes,
                      };
                    }
                  ),
              })
            );
          },

        /* =====================================================
           DUPLICATE QUIZ
        ===================================================== */

        duplicateQuiz:
          (
            pageId,
            quizId
          ) => {
            const state =
              get();

            const page =
              state.project.pages.find(
                (
                  item
                ) =>
                  item.id ===
                  pageId
              );

            if (!page) {
              return;
            }

            const source =
              page.quizzes.find(
                (
                  quiz
                ) =>
                  quiz.id ===
                  quizId
              );

            if (!source) {
              return;
            }

            let newTime =
              source.time +
              0.5;

            if (
              newTime >
              page.duration
            ) {
              newTime =
                source.time;
            }

            const copy:
              Quiz = {
                ...source,

                id:
                  createId(),

                time:
                  newTime,

                question:
                  `${source.question} - Bản sao`,

                options:
                  [
                    ...source.options,
                  ],
              };

            commitProject(
              (
                project
              ) => ({
                ...project,

                pages:
                  project.pages.map(
                    (
                      item
                    ) => {
                      if (
                        item.id !==
                        pageId
                      ) {
                        return item;
                      }

                      return {
                        ...item,

                        quizzes:
                          [
                            ...item.quizzes,
                            copy,
                          ].sort(
                            (
                              a,
                              b
                            ) =>
                              a.time -
                              b.time
                          ),
                      };
                    }
                  ),
              })
            );
          },

        /* =====================================================
           DELETE QUIZ
        ===================================================== */

        deleteQuiz:
          (
            pageId,
            quizId
          ) => {
            commitProject(
              (
                project
              ) => ({
                ...project,

                pages:
                  project.pages.map(
                    (
                      page
                    ) =>
                      page.id ===
                      pageId
                        ? {
                            ...page,

                            quizzes:
                              page.quizzes.filter(
                                (
                                  quiz
                                ) =>
                                  quiz.id !==
                                  quizId
                              ),
                          }
                        : page
                  ),
              })
            );
          },
      };
    }
  );