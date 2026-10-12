"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PageGamePlayer,
} from "@/components/games/PageGamePlayer";


import {
  EditorTopbar,
} from "@/components/editor/EditorTopbar";

import {
  PageNavigator,
} from "@/components/editor/PageNavigator";

import {
  VideoCanvas,
} from "@/components/editor/VideoCanvas";

import {
  PlayerControls,
} from "@/components/editor/PlayerControls";

import {
  Timeline,
} from "@/components/editor/Timeline";

import {
  QuestionPanel,
} from "@/components/editor/QuestionPanel";

import {
  QuestionEditor,
} from "@/components/editor/QuestionEditor";

import {
  useEditorStore,
} from "@/stores/editorStore";

import {
  createEmptyDraft,
  createInitialClassificationSelections,
  createInitialOrderingOrder,
  getQuizClassificationCategories,
  getQuizClassificationItems,
  getQuizCorrectIndexes,
  getQuizOrderingItems,
  getQuizType,
  isClassificationAnswerCorrect,
  isShortAnswerCorrect,
  isMatchingAnswerCorrect,
  isOrderingAnswerCorrect,
} from "@/types/lesson";

import type {
  Quiz,
  QuizDraft,
} from "@/types/lesson";

export default function EditorPage() {
  /* =======================================================
     STORE
  ======================================================= */

  /*
   * Lấy toàn bộ store.
   *
   * Cách này đơn giản và chắc chắn hơn trong giai đoạn
   * chúng ta đang kiểm tra chức năng nhiều trang.
   */
  const editor =
    useEditorStore();

  const {
    project,
    saveStatus,

    hydrate,
    saveProject,

    selectPage,
    addPage,
    renamePage,
    duplicatePage,
    deletePage,

    setPageVideo,
    setPageDuration,

    addQuiz,
    updateQuiz,
    duplicateQuiz,
    deleteQuiz,
  } = editor;

  /* =======================================================
     VIDEO
  ======================================================= */

  const videoRef =
    useRef<HTMLVideoElement>(
      null
    );

  const previousTimeRef =
    useRef(0);

  /* =======================================================
     PLAYER
  ======================================================= */

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(0);

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(false);

  /* =======================================================
     QUIZ PLAYER
  ======================================================= */

  const [
    activeQuiz,
    setActiveQuiz,
  ] =
    useState<Quiz | null>(
      null
    );

  const [
    answeredIds,
    setAnsweredIds,
  ] =
    useState<string[]>([]);

  const [
    score,
    setScore,
  ] =
    useState(0);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] =
    useState<number | null>(
      null
    );

  const [
    selectedAnswers,
    setSelectedAnswers,
  ] =
    useState<number[]>([]);

  const [
    shortAnswer,
    setShortAnswer,
  ] =
    useState("");

  const [
    matchingSelections,
    setMatchingSelections,
  ] =
    useState<number[]>([]);

  const [
    orderingSelections,
    setOrderingSelections,
  ] =
    useState<number[]>([]);

  const [
    classificationSelections,
    setClassificationSelections,
  ] =
    useState<number[]>([]);

  const [
    quizResult,
    setQuizResult,
  ] =
    useState<
      "correct" |
      "wrong" |
      null
    >(null);

  /* =======================================================
     QUESTION EDITOR
  ======================================================= */

  const [
    questionEditorOpen,
    setQuestionEditorOpen,
  ] =
    useState(false);

  const [
    editingQuizId,
    setEditingQuizId,
  ] =
    useState<string | null>(
      null
    );

  const [
    questionTime,
    setQuestionTime,
  ] =
    useState(0);

  const [
    draft,
    setDraft,
  ] =
    useState<QuizDraft>(
      createEmptyDraft()
    );

  useEffect(() => {
    if (
      !activeQuiz ||
      getQuizType(
        activeQuiz
      ) !==
        "ordering"
    ) {
      setOrderingSelections(
        []
      );

      return;
    }

    setOrderingSelections(
      createInitialOrderingOrder(
        activeQuiz
      )
    );
  }, [
    activeQuiz?.id,
  ]);

  useEffect(() => {
    if (
      !activeQuiz ||
      getQuizType(
        activeQuiz
      ) !==
        "classification"
    ) {
      setClassificationSelections(
        []
      );

      return;
    }

    setClassificationSelections(
      createInitialClassificationSelections(
        activeQuiz
      )
    );
  }, [
    activeQuiz?.id,
  ]);

  /* =======================================================
     LOAD PROJECT
  ======================================================= */

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  const page =
    project.pages.find(
      (item) =>
        item.id ===
        project.selectedPageId
    ) ??
    project.pages[0];

  /* =======================================================
     RESET WHEN PAGE CHANGES
  ======================================================= */

  useEffect(() => {
    videoRef.current?.pause();

    setCurrentTime(0);

    setIsPlaying(false);

    setActiveQuiz(null);

    setAnsweredIds([]);

    setSelectedAnswer(
      null
    );

    setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

    setQuizResult(null);

    setQuestionEditorOpen(
      false
    );

    setEditingQuizId(
      null
    );

    previousTimeRef.current =
      0;
  }, [
    project.selectedPageId,
  ]);

  /* =======================================================
     ADD PAGE
  ======================================================= */

  function handleAddPage() {
    console.log(
      "Bắt đầu thêm trang..."
    );

    console.log(
      "Số trang trước:",
      useEditorStore
        .getState()
        .project
        .pages.length
    );

    addPage();

    console.log(
      "Số trang sau:",
      useEditorStore
        .getState()
        .project
        .pages.length
    );
  }

  /* =======================================================
     SELECT PAGE
  ======================================================= */

  function handleSelectPage(
    pageId: string
  ) {
    videoRef.current?.pause();

    selectPage(
      pageId
    );
  }

  /* =======================================================
     DELETE PAGE
  ======================================================= */

  function handleDeletePage(
    pageId: string
  ) {
    deletePage(
      pageId
    );
  }

  /* =======================================================
     VIDEO UPLOAD
  ======================================================= */

  function handleVideoUpload(
    file: File
  ) {
    if (!page) {
      return;
    }

    const oldUrl =
      page.videoUrl;

    if (
      oldUrl &&
      oldUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        oldUrl
      );
    }

    const url =
      URL.createObjectURL(
        file
      );

    setPageVideo(
      page.id,
      url,
      file.name
    );

    setCurrentTime(0);

    setIsPlaying(false);

    setAnsweredIds([]);

    setActiveQuiz(null);

    setSelectedAnswer(
      null
    );

    setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

    setQuizResult(null);

    previousTimeRef.current =
      0;
  }

  /* =======================================================
     VIDEO METADATA
  ======================================================= */

  function handleLoadedMetadata() {
    if (!page) {
      return;
    }

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    setPageDuration(
      page.id,
      video.duration
    );
  }

  /* =======================================================
     PLAY / PAUSE
  ======================================================= */

  function togglePlay() {
    const video =
      videoRef.current;

    if (!video) {
      alert(
        "Trang này chưa có video."
      );

      return;
    }

    if (activeQuiz) {
      return;
    }

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  /* =======================================================
     VIDEO TIME UPDATE
  ======================================================= */

  function handleTimeUpdate() {
    if (!page) {
      return;
    }

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    const time =
      video.currentTime;

    setCurrentTime(
      time
    );

    if (!activeQuiz) {
      const previous =
        previousTimeRef.current;

      const quiz =
        page.quizzes.find(
          (item) =>
            !answeredIds.includes(
              item.id
            ) &&
            item.time >=
              previous &&
            item.time <=
              time
        );

      if (quiz) {
        video.pause();

        setIsPlaying(
          false
        );

        setActiveQuiz(
          quiz
        );

        setSelectedAnswer(
          null
        );

        setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

        setQuizResult(
          null
        );
      }
    }

    previousTimeRef.current =
      time;
  }

  /* =======================================================
     SEEK
  ======================================================= */

  function handleSeek(
    time: number
  ) {
    const video =
      videoRef.current;

    if (
      time <
      currentTime
    ) {
      /*
       * Tua ngược:
       * cho phép câu hỏi xuất hiện lại.
       */
      setAnsweredIds(
        []
      );

      setActiveQuiz(
        null
      );

      setSelectedAnswer(
        null
      );

      setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

      setQuizResult(
        null
      );
    }

    setCurrentTime(
      time
    );

    previousTimeRef.current =
      time;

    if (video) {
      video.currentTime =
        time;
    }
  }

  /* =======================================================
     ADD QUESTION
  ======================================================= */

  function openAddQuestion() {
    if (!page) {
      return;
    }

    if (
      !page.videoUrl
    ) {
      alert(
        "Hãy tải video cho trang này trước khi thêm câu hỏi."
      );

      return;
    }

    videoRef.current?.pause();

    setEditingQuizId(
      null
    );

    setQuestionTime(
      currentTime
    );

    setDraft(
      createEmptyDraft()
    );

    setQuestionEditorOpen(
      true
    );
  }

  /* =======================================================
     EDIT QUESTION
  ======================================================= */

  function openEditQuestion(
    quiz: Quiz
  ) {
    videoRef.current?.pause();

    setEditingQuizId(
      quiz.id
    );

    setQuestionTime(
      quiz.time
    );

    const quizType =
      getQuizType(quiz);

    const correctIndexes =
      getQuizCorrectIndexes(
        quiz
      );

    setDraft({
      type:
        quizType,

      question:
        quiz.question,

      options:
        quizType ===
        "true-false"
          ? [
              "Đúng",
              "Sai",
              "",
              "",
            ]
          : [
              quiz.options[0] ??
                "",

              quiz.options[1] ??
                "",

              quiz.options[2] ??
                "",

              quiz.options[3] ??
                "",
            ],

      correctIndex:
        quizType ===
        "true-false"
          ? (
              quiz.correctIndex ===
              1
                ? 1
                : 0
            )
          : correctIndexes[0] ??
            quiz.correctIndex,

      correctIndexes:
        correctIndexes,

      acceptedAnswers:
        quizType ===
        "short-answer"
          ? [
              ...(
                quiz.acceptedAnswers ??
                []
              ),
            ]
          : [
              "",
            ],

      matchingPairs:
        quizType ===
        "matching"
          ? [
              ...(
                quiz.matchingPairs ??
                []
              ).map(
                (pair) => ({
                  ...pair,
                })
              ),
              { left: "", right: "" },
              { left: "", right: "" },
              { left: "", right: "" },
              { left: "", right: "" },
            ].slice(0, 4)
          : [
              { left: "", right: "" },
              { left: "", right: "" },
              { left: "", right: "" },
              { left: "", right: "" },
            ],

      orderingItems:
        quizType ===
        "ordering"
          ? [
              ...(
                quiz.orderingItems ??
                []
              ),
              "",
              "",
              "",
              "",
            ].slice(0, 4)
          : [
              "",
              "",
              "",
              "",
            ],

      classificationCategories:
        quizType ===
        "classification"
          ? [
              ...(quiz.classificationCategories ?? []),
              "",
              "",
            ].slice(0, 2)
          : [
              "",
              "",
            ],

      classificationItems:
        quizType ===
        "classification"
          ? [
              ...(quiz.classificationItems ?? []).map(
                (item) => ({ ...item })
              ),
              { text: "", categoryIndex: 0 },
              { text: "", categoryIndex: 0 },
              { text: "", categoryIndex: 1 },
              { text: "", categoryIndex: 1 },
              { text: "", categoryIndex: 0 },
              { text: "", categoryIndex: 1 },
            ].slice(0, 6)
          : [
              { text: "", categoryIndex: 0 },
              { text: "", categoryIndex: 0 },
              { text: "", categoryIndex: 1 },
              { text: "", categoryIndex: 1 },
              { text: "", categoryIndex: 0 },
              { text: "", categoryIndex: 1 },
            ],

      points:
        quiz.points,

      feedbackCorrect:
        quiz.feedbackCorrect,

      feedbackWrong:
        quiz.feedbackWrong,
    });

    setQuestionEditorOpen(
      true
    );
  }

  /* =======================================================
     SAVE QUESTION
  ======================================================= */

  function saveQuestion() {
    if (!page) {
      return;
    }

    if (
      !draft.question.trim()
    ) {
      alert(
        "Hãy nhập nội dung câu hỏi."
      );

      return;
    }

    const acceptedAnswers =
      Array.from(
        new Set(
          draft.acceptedAnswers
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean)
        )
      );

    const matchingPairs =
      draft.matchingPairs
        .map((pair) => ({
          left: pair.left.trim(),
          right: pair.right.trim(),
        }));

    const incompleteMatchingPair =
      matchingPairs.some(
        (pair) =>
          Boolean(pair.left) !==
          Boolean(pair.right)
      );

    const completedMatchingPairs =
      matchingPairs.filter(
        (pair) =>
          pair.left &&
          pair.right
      );

    const orderingItems =
      draft.orderingItems
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);

    const classificationCategories =
      [
        draft.classificationCategories[0]?.trim() ?? "",
        draft.classificationCategories[1]?.trim() ?? "",
      ];

    const classificationItems =
      draft.classificationItems
        .map((item) => ({
          text: item.text.trim(),
          categoryIndex:
            item.categoryIndex === 1
              ? 1
              : 0,
        }))
        .filter((item) => item.text);

    switch (draft.type) {
      case "classification": {
        if (
          !classificationCategories[0] ||
          !classificationCategories[1]
        ) {
          alert(
            "Câu hỏi phân loại cần nhập tên của cả 2 nhóm."
          );

          return;
        }

        if (
          classificationCategories[0].toLocaleLowerCase("vi") ===
          classificationCategories[1].toLocaleLowerCase("vi")
        ) {
          alert(
            "Tên hai nhóm phân loại không được trùng nhau."
          );

          return;
        }

        if (classificationItems.length < 2) {
          alert(
            "Câu hỏi phân loại cần ít nhất 2 thẻ."
          );

          return;
        }

        const normalizedClassificationItems =
          classificationItems.map((item) =>
            item.text.toLocaleLowerCase("vi")
          );

        if (
          new Set(normalizedClassificationItems).size !==
          normalizedClassificationItems.length
        ) {
          alert(
            "Các thẻ phân loại không nên trùng nội dung."
          );

          return;
        }

        const hasGroup0 =
          classificationItems.some(
            (item) => item.categoryIndex === 0
          );

        const hasGroup1 =
          classificationItems.some(
            (item) => item.categoryIndex === 1
          );

        if (!hasGroup0 || !hasGroup1) {
          alert(
            "Mỗi nhóm cần có ít nhất 1 thẻ."
          );

          return;
        }

        break;
      }

      case "ordering": {
        if (orderingItems.length < 2) {
          alert(
            "Câu hỏi sắp xếp thứ tự cần ít nhất 2 bước."
          );

          return;
        }

        const normalizedOrderingItems =
          orderingItems.map((item) =>
            item.toLocaleLowerCase(
              "vi"
            )
          );

        if (
          new Set(
            normalizedOrderingItems
          ).size !==
          normalizedOrderingItems.length
        ) {
          alert(
            "Các bước trong câu hỏi sắp xếp không nên trùng nhau."
          );

          return;
        }

        break;
      }

      case "matching": {
        if (incompleteMatchingPair) {
          alert(
            "Mỗi cặp ghép đôi cần nhập đủ nội dung ở cả cột trái và cột phải."
          );

          return;
        }

        if (
          completedMatchingPairs.length <
          2
        ) {
          alert(
            "Câu hỏi ghép đôi cần ít nhất 2 cặp hoàn chỉnh."
          );

          return;
        }

        const normalizedRight =
          completedMatchingPairs.map(
            (pair) =>
              pair.right.toLocaleLowerCase(
                "vi"
              )
          );

        if (
          new Set(normalizedRight).size !==
          normalizedRight.length
        ) {
          alert(
            "Các nội dung ở cột phải của câu hỏi ghép đôi không nên trùng nhau."
          );

          return;
        }

        break;
      }

      case "short-answer": {
        if (acceptedAnswers.length === 0) {
          alert(
            "Hãy nhập ít nhất 1 đáp án chấp nhận được."
          );

          return;
        }

        break;
      }

      case "true-false": {
        const hasEmptyAnswer =
          draft.options
            .slice(0, 2)
            .some((item) =>
              !item.trim()
            );

        if (hasEmptyAnswer) {
          alert(
            "Câu hỏi Đúng / Sai cần đủ hai phương án."
          );

          return;
        }

        break;
      }

      case "multiple":
      case "multiple-choice": {
        const hasEmptyAnswer =
          draft.options.some(
            (item) =>
              !item.trim()
          );

        if (hasEmptyAnswer) {
          alert(
            "Hãy nhập đủ 4 đáp án A, B, C, D."
          );

          return;
        }

        break;
      }
    }

    const normalizedCorrectIndexes =
      Array.from(
        new Set(
          draft.correctIndexes.filter(
            (index) =>
              Number.isInteger(
                index
              ) &&
              index >= 0 &&
              index <= 3
          )
        )
      ).sort(
        (a, b) => a - b
      );

    if (
      draft.type ===
        "multiple" &&
      normalizedCorrectIndexes.length <
        2
    ) {
      alert(
        "Câu hỏi nhiều đáp án cần chọn ít nhất 2 đáp án đúng."
      );

      return;
    }

    const correctIndex =
      draft.type ===
      "short-answer" ||
      draft.type ===
      "matching" ||
      draft.type ===
      "ordering" ||
      draft.type ===
      "classification"
        ? 0
        : draft.type ===
          "true-false"
          ? (
              draft.correctIndex ===
              1
                ? 1
                : 0
            )
          : draft.type ===
            "multiple"
            ? normalizedCorrectIndexes[0] ??
              0
            : draft.correctIndex;

    const quiz: Quiz = {
      id:
        editingQuizId ??
        `quiz-${Date.now()}-${Math.random()
          .toString(36)
          .slice(
            2,
            8
          )}`,

      type:
        draft.type,

      time:
        questionTime,

      question:
        draft.question.trim(),

      options:
        draft.type ===
        "short-answer" ||
        draft.type ===
        "matching" ||
        draft.type ===
        "ordering" ||
        draft.type ===
        "classification"
          ? []
          : draft.type ===
            "true-false"
            ? [
                "Đúng",
                "Sai",
              ]
            : draft.options.map(
                (item) =>
                  item.trim()
              ),

      correctIndex,

      correctIndexes:
        draft.type ===
        "multiple"
          ? normalizedCorrectIndexes
          : undefined,

      acceptedAnswers:
        draft.type ===
        "short-answer"
          ? acceptedAnswers
          : undefined,

      matchingPairs:
        draft.type ===
        "matching"
          ? completedMatchingPairs
          : undefined,

      orderingItems:
        draft.type ===
        "ordering"
          ? orderingItems
          : undefined,

      classificationCategories:
        draft.type ===
        "classification"
          ? classificationCategories
          : undefined,

      classificationItems:
        draft.type ===
        "classification"
          ? classificationItems
          : undefined,

      points:
        draft.points,

      feedbackCorrect:
        draft.feedbackCorrect.trim(),

      feedbackWrong:
        draft.feedbackWrong.trim(),
    };

    if (
      editingQuizId
    ) {
      updateQuiz(
        page.id,
        editingQuizId,
        quiz
      );
    } else {
      addQuiz(
        page.id,
        quiz
      );
    }

    setQuestionEditorOpen(
      false
    );

    setEditingQuizId(
      null
    );
  }

  /* =======================================================
     ANSWER QUESTION
  ======================================================= */

  function answerQuestion(
    index: number
  ) {
    if (
      !activeQuiz ||
      quizResult
    ) {
      return;
    }

    if (
      getQuizType(
        activeQuiz
      ) ===
      "short-answer" ||
      getQuizType(
        activeQuiz
      ) ===
      "matching" ||
      getQuizType(
        activeQuiz
      ) ===
      "ordering" ||
      getQuizType(
        activeQuiz
      ) ===
      "classification"
    ) {
      return;
    }

    if (
      getQuizType(
        activeQuiz
      ) ===
      "multiple"
    ) {
      toggleMultipleAnswer(
        index
      );

      return;
    }

    setSelectedAnswer(
      index
    );

    const correct =
      index ===
      activeQuiz.correctIndex;

    if (correct) {
      setQuizResult(
        "correct"
      );

      setScore(
        (oldScore) =>
          oldScore +
          activeQuiz.points
      );
    } else {
      setQuizResult(
        "wrong"
      );
    }
  }

  function toggleMultipleAnswer(
    index: number
  ) {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "multiple"
    ) {
      return;
    }

    setSelectedAnswers(
      (old) =>
        old.includes(index)
          ? old.filter(
              (item) =>
                item !==
                index
            )
          : [
              ...old,
              index,
            ].sort(
              (a, b) =>
                a - b
            )
    );
  }

  function submitMultipleAnswer() {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "multiple" ||
      selectedAnswers.length ===
        0
    ) {
      return;
    }

    const correctIndexes =
      getQuizCorrectIndexes(
        activeQuiz
      );

    const selected =
      [...selectedAnswers].sort(
        (a, b) => a - b
      );

    const correct =
      selected.length ===
        correctIndexes.length &&
      selected.every(
        (value, index) =>
          value ===
          correctIndexes[index]
      );

    if (correct) {
      setQuizResult(
        "correct"
      );

      setScore(
        (oldScore) =>
          oldScore +
          activeQuiz.points
      );
    } else {
      setQuizResult(
        "wrong"
      );
    }
  }

  function submitShortAnswer() {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "short-answer" ||
      !shortAnswer.trim()
    ) {
      return;
    }

    const correct =
      isShortAnswerCorrect(
        shortAnswer,
        activeQuiz.acceptedAnswers
      );

    if (correct) {
      setQuizResult(
        "correct"
      );

      setScore(
        (oldScore) =>
          oldScore +
          activeQuiz.points
      );
    } else {
      setQuizResult(
        "wrong"
      );
    }
  }

  function changeMatchingSelection(
    leftIndex: number,
    rightIndex: number
  ) {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "matching"
    ) {
      return;
    }

    const pairCount =
      (
        activeQuiz.matchingPairs ??
        []
      ).filter(
        (pair) =>
          pair.left?.trim() &&
          pair.right?.trim()
      ).length;

    setMatchingSelections(
      (old) => {
        const next =
          Array.from(
            { length: pairCount },
            (_, index) =>
              old[index] ?? -1
          );

        next[leftIndex] =
          rightIndex;

        return next;
      }
    );
  }

  function submitMatchingAnswer() {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "matching"
    ) {
      return;
    }

    const pairCount =
      (
        activeQuiz.matchingPairs ??
        []
      ).filter(
        (pair) =>
          pair.left?.trim() &&
          pair.right?.trim()
      ).length;

    if (
      pairCount < 2 ||
      matchingSelections.length !==
        pairCount ||
      matchingSelections.some(
        (value) =>
          value < 0
      )
    ) {
      return;
    }

    const correct =
      isMatchingAnswerCorrect(
        matchingSelections,
        activeQuiz.matchingPairs
      );

    if (correct) {
      setQuizResult(
        "correct"
      );

      setScore(
        (oldScore) =>
          oldScore +
          activeQuiz.points
      );
    } else {
      setQuizResult(
        "wrong"
      );
    }
  }

  function moveOrderingItem(
    position: number,
    direction:
      | -1
      | 1
  ) {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "ordering"
    ) {
      return;
    }

    setOrderingSelections(
      (old) => {
        const target =
          position +
          direction;

        if (
          target < 0 ||
          target >=
            old.length
        ) {
          return old;
        }

        const next =
          [
            ...old,
          ];

        [
          next[position],
          next[target],
        ] = [
          next[target],
          next[position],
        ];

        return next;
      }
    );
  }

  function submitOrderingAnswer() {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(
        activeQuiz
      ) !==
        "ordering"
    ) {
      return;
    }

    const items =
      getQuizOrderingItems(
        activeQuiz
      );

    if (
      items.length < 2 ||
      orderingSelections.length !==
        items.length
    ) {
      return;
    }

    const correct =
      isOrderingAnswerCorrect(
        orderingSelections,
        activeQuiz.orderingItems
      );

    if (correct) {
      setQuizResult(
        "correct"
      );

      setScore(
        (oldScore) =>
          oldScore +
          activeQuiz.points
      );
    } else {
      setQuizResult(
        "wrong"
      );
    }
  }

  function changeClassificationSelection(
    itemIndex: number,
    categoryIndex: number
  ) {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(activeQuiz) !==
        "classification"
    ) {
      return;
    }

    const itemCount =
      getQuizClassificationItems(
        activeQuiz
      ).length;

    if (
      itemIndex < 0 ||
      itemIndex >= itemCount
    ) {
      return;
    }

    const normalizedCategory =
      categoryIndex === 0 ||
      categoryIndex === 1
        ? categoryIndex
        : -1;

    setClassificationSelections(
      (old) => {
        const next =
          Array.from(
            { length: itemCount },
            (_, index) =>
              old[index] ?? -1
          );

        next[itemIndex] =
          normalizedCategory;

        return next;
      }
    );
  }

  function submitClassificationAnswer() {
    if (
      !activeQuiz ||
      quizResult ||
      getQuizType(activeQuiz) !==
        "classification"
    ) {
      return;
    }

    const categories =
      getQuizClassificationCategories(
        activeQuiz
      );

    const items =
      getQuizClassificationItems(
        activeQuiz
      );

    if (
      !categories[0] ||
      !categories[1] ||
      items.length < 2 ||
      classificationSelections.length !==
        items.length ||
      classificationSelections.some(
        (value) => value < 0
      )
    ) {
      return;
    }

    const correct =
      isClassificationAnswerCorrect(
        classificationSelections,
        activeQuiz.classificationItems
      );

    if (correct) {
      setQuizResult(
        "correct"
      );

      setScore(
        (oldScore) =>
          oldScore +
          activeQuiz.points
      );
    } else {
      setQuizResult(
        "wrong"
      );
    }
  }

  /* =======================================================
     CONTINUE VIDEO
  ======================================================= */

  function continueVideo() {
    if (!activeQuiz) {
      return;
    }

    setAnsweredIds(
      (old) => [
        ...old,
        activeQuiz.id,
      ]
    );

    setActiveQuiz(
      null
    );

    setSelectedAnswer(
      null
    );

    setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

    setQuizResult(
      null
    );

    previousTimeRef.current =
      currentTime +
      0.05;

    setTimeout(() => {
      void videoRef.current?.play();
    }, 50);
  }

  /* =======================================================
     JUMP TO QUIZ
  ======================================================= */

  function jumpToQuiz(
    quiz: Quiz
  ) {
    const video =
      videoRef.current;

    if (!video) {
      alert(
        "Trang này chưa có video."
      );

      return;
    }

    video.pause();

    setAnsweredIds(
      (old) =>
        old.filter(
          (id) =>
            id !==
            quiz.id
        )
    );

    setActiveQuiz(
      null
    );

    setSelectedAnswer(
      null
    );

    setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

    setQuizResult(
      null
    );

    video.currentTime =
      quiz.time;

    setCurrentTime(
      quiz.time
    );

    previousTimeRef.current =
      quiz.time;
  }

  /* =======================================================
     DUPLICATE QUESTION
  ======================================================= */

  function handleDuplicateQuiz(
    quiz: Quiz
  ) {
    if (!page) {
      return;
    }

    duplicateQuiz(
      page.id,
      quiz.id
    );
  }

  /* =======================================================
     DELETE QUESTION
  ======================================================= */

  function handleDeleteQuiz(
    quiz: Quiz
  ) {
    if (!page) {
      return;
    }

    const confirmed =
      window.confirm(
        `Bạn có chắc muốn xóa câu hỏi:\n\n"${quiz.question}"?`
      );

    if (!confirmed) {
      return;
    }

    deleteQuiz(
      page.id,
      quiz.id
    );

    if (
      activeQuiz?.id ===
      quiz.id
    ) {
      setActiveQuiz(
        null
      );

      setSelectedAnswer(
        null
      );

      setSelectedAnswers([]);

    setShortAnswer("");

    setMatchingSelections([]);

    setOrderingSelections([]);

    setClassificationSelections([]);

      setQuizResult(
        null
      );
    }
  }

  /* =======================================================
     SAFETY
  ======================================================= */

  if (!page) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#061426] text-white">

        <div className="text-center">

          <div className="text-xl font-bold">
            Không có trang bài giảng
          </div>

          <button
            type="button"
            onClick={
              handleAddPage
            }
            className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-bold"
          >
            Tạo trang mới
          </button>

        </div>

      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#061426] text-white">

      {/* TOP */}

      <EditorTopbar
        title={
          project.title
        }
        saveStatus={
          saveStatus
        }
        score={
          score
        }
        onSave={
          saveProject
        }
      />

      {/* WORKSPACE */}

      <div className="flex min-h-0 flex-1">

        {/* LEFT */}

        <PageNavigator
          pages={
            project.pages
          }
          selectedPageId={
            project.selectedPageId
          }
          onSelect={
            handleSelectPage
          }
          onAdd={
            handleAddPage
          }
          onRename={
            renamePage
          }
          onDuplicate={
            duplicatePage
          }
          onDelete={
            handleDeletePage
          }
        />

        {/* CENTER */}

        <main className="flex min-w-0 flex-1 flex-col">

          <PageGamePlayer
            projectId={
              project.id
            }
            pageId={
              page.id
            }
            variant="editor"
          />

          <VideoCanvas
            page={
              page
            }
            videoRef={
              videoRef
            }
            activeQuiz={
              activeQuiz
            }
            selectedAnswer={
              selectedAnswer
            }
            selectedAnswers={
              selectedAnswers
            }
            shortAnswer={
              shortAnswer
            }
            matchingSelections={
              matchingSelections
            }
            orderingSelections={
              orderingSelections
            }
            classificationSelections={
              classificationSelections
            }
            quizResult={
              quizResult
            }
            onVideoUpload={
              handleVideoUpload
            }
            onLoadedMetadata={
              handleLoadedMetadata
            }
            onTimeUpdate={
              handleTimeUpdate
            }
            onPlay={() =>
              setIsPlaying(
                true
              )
            }
            onPause={() =>
              setIsPlaying(
                false
              )
            }
            onAnswer={
              answerQuestion
            }
            onToggleMultipleAnswer={
              toggleMultipleAnswer
            }
            onSubmitMultipleAnswer={
              submitMultipleAnswer
            }
            onShortAnswerChange={
              setShortAnswer
            }
            onSubmitShortAnswer={
              submitShortAnswer
            }
            onMatchingSelectionChange={
              changeMatchingSelection
            }
            onSubmitMatchingAnswer={
              submitMatchingAnswer
            }
            onMoveOrderingItem={
              moveOrderingItem
            }
            onSubmitOrderingAnswer={
              submitOrderingAnswer
            }
            onClassificationSelectionChange={
              changeClassificationSelection
            }
            onSubmitClassificationAnswer={
              submitClassificationAnswer
            }
            onContinue={
              continueVideo
            }
          />

          <PlayerControls
            currentTime={
              currentTime
            }
            duration={
              page.duration
            }
            isPlaying={
              isPlaying
            }
            onTogglePlay={
              togglePlay
            }
            onSeek={
              handleSeek
            }
            onAddQuestion={
              openAddQuestion
            }
          />

          <Timeline
            duration={
              page.duration
            }
            currentTime={
              currentTime
            }
            quizzes={
              page.quizzes
            }
            onQuizClick={
              jumpToQuiz
            }
          />

        </main>

        {/* RIGHT */}

        <QuestionPanel
          page={
            page
          }
          onVideoUpload={
            handleVideoUpload
          }
          onJump={
            jumpToQuiz
          }
          onEdit={
            openEditQuestion
          }
          onDuplicate={
            handleDuplicateQuiz
          }
          onDelete={
            handleDeleteQuiz
          }
        />

      </div>

      {/* MODAL */}

      <QuestionEditor
        open={
          questionEditorOpen
        }
        editing={
          editingQuizId !==
          null
        }
        draft={
          draft
        }
        time={
          questionTime
        }
        duration={
          page.duration
        }
        onDraftChange={
          setDraft
        }
        onTimeChange={
          setQuestionTime
        }
        onClose={() => {
          setQuestionEditorOpen(
            false
          );

          setEditingQuizId(
            null
          );
        }}
        onSave={
          saveQuestion
        }
      />

    </div>
  );
}