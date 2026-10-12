export type QuizType =
  | "multiple-choice"
  | "true-false"
  | "multiple"
  | "short-answer"
  | "matching"
  | "ordering"
  | "classification";

export type MatchingPair = {
  left: string;
  right: string;
};

export type ClassificationItem = {
  text: string;
  categoryIndex: number;
};

export type Quiz = {
  id: string;

  // Giữ optional để tương thích project cũ.
  // Nếu thiếu type, hệ thống hiểu là trắc nghiệm 1 đáp án.
  type?: QuizType;

  // Thời điểm câu hỏi xuất hiện trong video
  time: number;

  question: string;

  // Danh sách đáp án
  options: string[];

  // Trắc nghiệm: 0 = A, 1 = B, 2 = C, 3 = D
  // Đúng/Sai: 0 = Đúng, 1 = Sai
  // Nhiều đáp án: vẫn giữ correctIndex để tương thích dữ liệu cũ.
  correctIndex: number;

  // Chỉ dùng cho câu hỏi nhiều đáp án đúng.
  // Ví dụ [0, 2] = A và C đúng.
  correctIndexes?: number[];

  // Chỉ dùng cho câu hỏi trả lời ngắn.
  // Có thể khai báo nhiều đáp án được chấp nhận.
  acceptedAnswers?: string[];

  // Chỉ dùng cho câu hỏi ghép đôi.
  // Mỗi phần tử là một cặp trái - phải đúng.
  matchingPairs?: MatchingPair[];

  // Chỉ dùng cho câu hỏi sắp xếp thứ tự.
  // Thứ tự phần tử trong mảng chính là thứ tự đúng.
  orderingItems?: string[];

  // Chỉ dùng cho câu hỏi phân loại kéo thả.
  // Phiên bản V12.0F dùng đúng 2 nhóm để đảm bảo ổn định
  // trên Editor, Preview và SCORM 1.2.
  classificationCategories?: string[];
  classificationItems?: ClassificationItem[];

  points: number;

  feedbackCorrect: string;

  feedbackWrong: string;
};

export type QuizDraft = {
  type: QuizType;

  question: string;

  options: [
    string,
    string,
    string,
    string
  ];

  correctIndex: number;

  correctIndexes: number[];

  acceptedAnswers: string[];

  matchingPairs: MatchingPair[];

  orderingItems: string[];

  classificationCategories: string[];

  classificationItems: ClassificationItem[];

  points: number;

  feedbackCorrect: string;

  feedbackWrong: string;
};

export type LessonPage = {
  id: string;

  title: string;

  // Tên file video
  videoName: string;

  // URL tạm để phát video trong trình duyệt
  videoUrl?: string;

  // Thời lượng video tính bằng giây
  duration: number;

  // Danh sách câu hỏi của riêng trang này
  quizzes: Quiz[];
};

export type ProjectDocument = {
  id: string;

  title: string;

  // Trang đang được chọn
  selectedPageId: string;

  // Toàn bộ trang trong dự án
  pages: LessonPage[];
};

export function getQuizType(
  quiz: Pick<Quiz, "type">
): QuizType {
  if (quiz.type === "true-false") {
    return "true-false";
  }

  if (quiz.type === "multiple") {
    return "multiple";
  }

  if (quiz.type === "short-answer") {
    return "short-answer";
  }

  if (quiz.type === "matching") {
    return "matching";
  }

  if (quiz.type === "ordering") {
    return "ordering";
  }

  if (quiz.type === "classification") {
    return "classification";
  }

  return "multiple-choice";
}

export function getQuizCorrectIndexes(
  quiz: Pick<
    Quiz,
    "type" | "correctIndex" | "correctIndexes"
  >
): number[] {
  if (getQuizType(quiz) !== "multiple") {
    return [quiz.correctIndex];
  }

  const source =
    Array.isArray(quiz.correctIndexes)
      ? quiz.correctIndexes
      : [];

  const normalized =
    Array.from(
      new Set(
        source.filter(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index <= 3
        )
      )
    ).sort((a, b) => a - b);

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    Number.isInteger(quiz.correctIndex) &&
    quiz.correctIndex >= 0 &&
    quiz.correctIndex <= 3
      ? quiz.correctIndex
      : 0,
  ];
}

export function createEmptyDraft(): QuizDraft {
  return {
    type:
      "multiple-choice",

    question: "",

    options: [
      "",
      "",
      "",
      "",
    ],

    correctIndex: 0,

    correctIndexes: [0],

    acceptedAnswers: [
      "",
    ],

    matchingPairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],

    orderingItems: [
      "",
      "",
      "",
      "",
    ],

    classificationCategories: [
      "",
      "",
    ],

    classificationItems: [
      { text: "", categoryIndex: 0 },
      { text: "", categoryIndex: 0 },
      { text: "", categoryIndex: 1 },
      { text: "", categoryIndex: 1 },
      { text: "", categoryIndex: 0 },
      { text: "", categoryIndex: 1 },
    ],

    points: 10,

    feedbackCorrect:
      "Chính xác! Bạn đã trả lời đúng.",

    feedbackWrong:
      "Chưa chính xác. Hãy xem lại nội dung.",
  };
}

export function normalizeShortAnswer(
  value: string
) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");
}

export function isShortAnswerCorrect(
  answer: string,
  acceptedAnswers:
    | string[]
    | undefined
) {
  const normalizedAnswer =
    normalizeShortAnswer(answer);

  if (!normalizedAnswer) {
    return false;
  }

  const accepted =
    (acceptedAnswers ?? [])
      .map(
        (item) =>
          normalizeShortAnswer(
            item
          )
      )
      .filter(Boolean);

  return accepted.includes(
    normalizedAnswer
  );
}

export function getQuizMatchingPairs(
  quiz: Pick<Quiz, "matchingPairs">
): MatchingPair[] {
  return (quiz.matchingPairs ?? [])
    .map((pair) => ({
      left:
        typeof pair?.left === "string"
          ? pair.left.trim()
          : "",
      right:
        typeof pair?.right === "string"
          ? pair.right.trim()
          : "",
    }))
    .filter(
      (pair) =>
        pair.left.length > 0 &&
        pair.right.length > 0
    );
}

export function isMatchingAnswerCorrect(
  selections: number[],
  matchingPairs:
    | MatchingPair[]
    | undefined
) {
  const pairs =
    getQuizMatchingPairs({
      matchingPairs,
    });

  if (
    pairs.length < 2 ||
    selections.length !==
      pairs.length
  ) {
    return false;
  }

  return selections.every(
    (rightIndex, leftIndex) =>
      rightIndex === leftIndex
  );
}


export function getQuizOrderingItems(
  quiz: Pick<Quiz, "orderingItems">
): string[] {
  return (quiz.orderingItems ?? [])
    .map(
      (item) =>
        typeof item === "string"
          ? item.trim()
          : ""
    )
    .filter(Boolean);
}

export function createInitialOrderingOrder(
  quiz: Pick<Quiz, "orderingItems">
): number[] {
  const items =
    getQuizOrderingItems(quiz);

  return items.map(
    (_, index) =>
      items.length -
      1 -
      index
  );
}

export function isOrderingAnswerCorrect(
  order: number[],
  orderingItems:
    | string[]
    | undefined
) {
  const items =
    getQuizOrderingItems({
      orderingItems,
    });

  if (
    items.length < 2 ||
    order.length !==
      items.length
  ) {
    return false;
  }

  return order.every(
    (sourceIndex, position) =>
      sourceIndex === position
  );
}


export function getQuizClassificationCategories(
  quiz: Pick<Quiz, "classificationCategories">
): string[] {
  const source =
    Array.isArray(quiz.classificationCategories)
      ? quiz.classificationCategories
      : [];

  return [
    typeof source[0] === "string"
      ? source[0].trim()
      : "",
    typeof source[1] === "string"
      ? source[1].trim()
      : "",
  ];
}

export function getQuizClassificationItems(
  quiz: Pick<Quiz, "classificationItems">
): ClassificationItem[] {
  return (quiz.classificationItems ?? [])
    .map((item) => ({
      text:
        typeof item?.text === "string"
          ? item.text.trim()
          : "",
      categoryIndex:
        item?.categoryIndex === 1
          ? 1
          : 0,
    }))
    .filter(
      (item) =>
        item.text.length > 0
    );
}

export function createInitialClassificationSelections(
  quiz: Pick<Quiz, "classificationItems">
): number[] {
  return getQuizClassificationItems(quiz).map(
    () => -1
  );
}

export function isClassificationAnswerCorrect(
  selections: number[],
  classificationItems:
    | ClassificationItem[]
    | undefined
) {
  const items =
    getQuizClassificationItems({
      classificationItems,
    });

  if (
    items.length < 2 ||
    selections.length !==
      items.length
  ) {
    return false;
  }

  return selections.every(
    (categoryIndex, itemIndex) =>
      categoryIndex ===
      items[itemIndex].categoryIndex
  );
}

export function formatTime(
  seconds: number
) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return `${minutes}:${secs
    .toString()
    .padStart(2, "0")}`;
}
