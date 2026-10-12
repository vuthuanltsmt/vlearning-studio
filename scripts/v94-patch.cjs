const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "lib",
  "scormExport.ts"
);

let source = fs.readFileSync(
  filePath,
  "utf8"
);

/* =========================================================
   SAFETY
========================================================= */

if (
  source.includes(
    "function maybeCompleteCurrentPage("
  )
) {
  console.log(
    "V9.4b đã được áp dụng trước đó."
  );

  process.exit(0);
}

function fail(message) {
  throw new Error(message);
}

/* =========================================================
   FIND FUNCTION RANGE
========================================================= */

function findFunctionRange(
  functionName
) {
  const marker =
    `function ${functionName}(`;

  const start =
    source.indexOf(
      marker
    );

  if (start === -1) {
    fail(
      `Không tìm thấy function ${functionName}()`
    );
  }

  const openBrace =
    source.indexOf(
      "{",
      start
    );

  if (openBrace === -1) {
    fail(
      `Không tìm thấy dấu { của ${functionName}()`
    );
  }

  let depth = 0;

  for (
    let i = openBrace;
    i < source.length;
    i++
  ) {
    const char =
      source[i];

    if (char === "{") {
      depth++;
    }

    if (char === "}") {
      depth--;

      if (depth === 0) {
        return {
          start,
          openBrace,
          end: i + 1,
        };
      }
    }
  }

  fail(
    `Không tìm thấy dấu } kết thúc ${functionName}()`
  );
}

/* =========================================================
   INSERT BEFORE FUNCTION
========================================================= */

function insertBeforeFunction(
  functionName,
  code
) {
  const range =
    findFunctionRange(
      functionName
    );

  source =
    source.slice(
      0,
      range.start
    ) +
    code +
    "\n\n  " +
    source.slice(
      range.start
    );
}

/* =========================================================
   INSERT INSIDE FUNCTION AFTER TEXT
========================================================= */

function insertAfterInsideFunction(
  functionName,
  searchText,
  code
) {
  const range =
    findFunctionRange(
      functionName
    );

  const block =
    source.slice(
      range.start,
      range.end
    );

  const localIndex =
    block.indexOf(
      searchText
    );

  if (localIndex === -1) {
    fail(
      `Trong ${functionName}() không tìm thấy: ${searchText}`
    );
  }

  const insertAt =
    range.start +
    localIndex +
    searchText.length;

  source =
    source.slice(
      0,
      insertAt
    ) +
    code +
    source.slice(
      insertAt
    );
}

/* =========================================================
   1. COMPLETION HELPER
========================================================= */

const completionHelper = `function requiredQuizzesComplete(
    page
  ) {
    if (
      !course.completion
        .requireAllQuizzes
    ) {
      return true;
    }

    return page.quizzes.every(
      function (quiz) {
        return state
          .answeredQuizIds
          .has(
            quiz.id
          );
      }
    );
  }

  function maybeCompleteCurrentPage() {
    var page =
      currentPage();

    if (!page) {
      return false;
    }

    /*
     * Nếu đã hoàn thành rồi
     * thì chỉ đồng bộ lại UI.
     */
    if (
      state.completedPageIds.has(
        page.id
      )
    ) {
      var existingNext =
        document.getElementById(
          "next"
        );

      if (existingNext) {
        existingNext.disabled =
          Boolean(
            state.activeQuiz
          );
      }

      return true;
    }

    /*
     * Kiểm tra quiz bắt buộc.
     */
    if (
      !requiredQuizzesComplete(
        page
      )
    ) {
      return false;
    }

    /*
     * Trang không có video:
     * chỉ cần thỏa điều kiện quiz.
     */
    var watchOk =
      !page.videoSrc;

    if (page.videoSrc) {
      var video =
        document.getElementById(
          "course-video"
        );

      var totalDuration =
        video &&
        Number.isFinite(
          video.duration
        ) &&
        video.duration > 0
          ? video.duration
          : page.duration;

      var percent =
        watchPercent(
          page.id,
          totalDuration
        );

      watchOk =
        percent >=
        course.completion
          .minWatchPercent;
    }

    if (!watchOk) {
      return false;
    }

    /*
     * Đạt toàn bộ điều kiện.
     */
    state
      .completedPageIds
      .add(
        page.id
      );

    state.completionNotice =
      "";

    /*
     * Không gọi render().
     *
     * Nếu render ở đây, thẻ video
     * sẽ bị tạo lại và làm gián đoạn
     * playback.
     */
    var status =
      document.querySelector(
        ".progress-info .progress-notice, .progress-info .completed"
      );

    if (status) {
      status.className =
        "completed";

      status.textContent =
        "✓ Trang đã hoàn thành";
    }

    var nextButton =
      document.getElementById(
        "next"
      );

    if (nextButton) {
      nextButton.disabled =
        Boolean(
          state.activeQuiz
        );
    }

    return true;
  }`;

insertBeforeFunction(
  "showQuiz",
  completionHelper
);

console.log(
  "✓ Đã thêm engine kiểm tra hoàn thành"
);

/* =========================================================
   2. TIMEUPDATE
========================================================= */

const timeUpdateMarker =
  `video.addEventListener(
      "timeupdate"`;

const timeUpdateStart =
  source.indexOf(
    timeUpdateMarker
  );

if (timeUpdateStart === -1) {
  fail(
    "Không tìm thấy event timeupdate của video."
  );
}

const updateControlsIndex =
  source.indexOf(
    "updateControls();",
    timeUpdateStart
  );

if (
  updateControlsIndex ===
  -1
) {
  fail(
    "Không tìm thấy updateControls() trong timeupdate."
  );
}

const updateControlsEnd =
  updateControlsIndex +
  "updateControls();".length;

source =
  source.slice(
    0,
    updateControlsEnd
  ) +
  `

        /*
         * Kiểm tra ngay trong lúc video chạy.
         * Khi đạt đủ tỷ lệ xem, nút Trang
         * tiếp theo được mở ngay.
         */
        maybeCompleteCurrentPage();` +
  source.slice(
    updateControlsEnd
  );

console.log(
  "✓ Đã nối kiểm tra vào timeupdate"
);

/* =========================================================
   3. AFTER QUIZ
========================================================= */

insertAfterInsideFunction(
  "continueAfterQuiz",
  "render();",
  `

    /*
     * Nếu tỷ lệ xem đã đủ từ trước,
     * quiz cuối vừa hoàn thành có thể
     * làm trang đạt điều kiện ngay.
     */
    window.setTimeout(
      maybeCompleteCurrentPage,
      0
    );`
);

console.log(
  "✓ Đã nối kiểm tra sau khi làm quiz"
);

/* =========================================================
   4. AFTER SKIPPING OPTIONAL QUIZ
========================================================= */

insertAfterInsideFunction(
  "skipQuiz",
  "render();",
  `

    window.setTimeout(
      maybeCompleteCurrentPage,
      0
    );`
);

console.log(
  "✓ Đã nối kiểm tra sau khi bỏ qua quiz"
);

/* =========================================================
   5. INITIAL RENDER
========================================================= */

const renderRange =
  findFunctionRange(
    "render"
  );

const insertBeforeRenderEnd =
  renderRange.end - 1;

source =
  source.slice(
    0,
    insertBeforeRenderEnd
  ) +
  `

    /*
     * Hỗ trợ cả trường hợp giáo viên
     * đặt tỷ lệ xem = 0%.
     */
    window.setTimeout(
      maybeCompleteCurrentPage,
      0
    );
  ` +
  source.slice(
    insertBeforeRenderEnd
  );

console.log(
  "✓ Đã nối kiểm tra sau render"
);

/* =========================================================
   WRITE
========================================================= */

fs.writeFileSync(
  filePath,
  source,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "V9.4b PATCH THÀNH CÔNG"
);
console.log(
  "========================================"
);
console.log(
  "Đã cập nhật lib/scormExport.ts"
);