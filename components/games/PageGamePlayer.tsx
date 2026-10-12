"use client";

import {
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  RotateCcw,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  GAME_LIBRARY_KEY,
  GAME_LINKS_KEY,
  loadGamesForPage,
} from "@/lib/pageGames";

import type {
  PageGame,
} from "@/lib/pageGames";

type PageGamePlayerProps = {
  projectId: string;
  pageId: string;
  variant:
    | "editor"
    | "preview";
};

export function PageGamePlayer({
  projectId,
  pageId,
  variant,
}: PageGamePlayerProps) {
  const [
    games,
    setGames,
  ] =
    useState<PageGame[]>(
      []
    );

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    gameIndex,
    setGameIndex,
  ] =
    useState(0);

  const [
    questionIndex,
    setQuestionIndex,
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
    score,
    setScore,
  ] =
    useState(0);

  const [
    finished,
    setFinished,
  ] =
    useState(false);

  function refresh() {
    const next =
      loadGamesForPage(
        projectId,
        pageId
      );

    setGames(
      next
    );

    setGameIndex(
      (current) =>
        next.length ===
        0
          ? 0
          : Math.min(
              current,
              next.length -
                1
            )
    );
  }

  useEffect(() => {
    refresh();

    function handleStorage(
      event: StorageEvent
    ) {
      if (
        event.key ===
          GAME_LIBRARY_KEY ||
        event.key ===
          GAME_LINKS_KEY
      ) {
        refresh();
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [
    projectId,
    pageId,
  ]);

  useEffect(() => {
    setOpen(
      false
    );
    setGameIndex(0);
    resetPlay();
  }, [
    projectId,
    pageId,
  ]);

  function resetPlay() {
    setQuestionIndex(0);
    setSelected(
      null
    );
    setScore(0);
    setFinished(
      false
    );
  }

  function openPlayer() {
    if (
      games.length ===
      0
    ) {
      return;
    }

    resetPlay();
    setOpen(
      true
    );
  }

  function switchGame(
    index: number
  ) {
    setGameIndex(
      index
    );
    resetPlay();
  }

  const game =
    games[
      gameIndex
    ];

  const question =
    game?.questions[
      questionIndex
    ];

  function choose(
    answerIndex: number
  ) {
    if (
      !question ||
      selected !==
        null ||
      finished
    ) {
      return;
    }

    setSelected(
      answerIndex
    );

    if (
      answerIndex ===
      question.correct
    ) {
      setScore(
        (value) =>
          value + 1
      );
    }
  }

  function next() {
    if (
      !game
    ) {
      return;
    }

    if (
      questionIndex >=
      game.questions.length -
        1
    ) {
      setFinished(
        true
      );
      return;
    }

    setQuestionIndex(
      (value) =>
        value + 1
    );
    setSelected(
      null
    );
  }

  if (
    games.length ===
    0
  ) {
    return null;
  }

  return (
    <>
      {variant ===
      "editor" ? (
        <div className="mx-3 mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <Gamepad2
                size={19}
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.12em] text-amber-300">
                Trò chơi của trang
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-300">
                {games.length} trò chơi •{" "}
                {games
                  .map(
                    (item) =>
                      item.title
                  )
                  .join(
                    " • "
                  )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openPlayer
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-400"
          >
            <Gamepad2
              size={15}
            />
            Chơi thử
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={
            openPlayer
          }
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-black/70 px-3 py-2 text-xs font-black text-amber-200 shadow-xl backdrop-blur transition hover:bg-black/85 sm:right-4 sm:top-4"
        >
          <Gamepad2
            size={16}
          />
          Trò chơi
          <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] text-slate-950">
            {games.length}
          </span>
        </button>
      )}

      {open &&
        game &&
        question && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="my-auto w-full max-w-4xl overflow-hidden rounded-[24px] border border-blue-700/70 bg-[#071d35] text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-blue-900/80 bg-[#0b2a4c] px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
                  <Gamepad2
                    size={14}
                  />
                  Trò chơi tương tác
                </div>

                <div className="mt-1 truncate text-lg font-black">
                  {game.title}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(
                    false
                  )
                }
                aria-label="Đóng trò chơi"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {games.length >
              1 && (
              <div className="flex gap-2 overflow-x-auto border-b border-blue-900/80 bg-[#08233f] px-4 py-3">
                {games.map(
                  (
                    item,
                    index
                  ) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        switchGame(
                          index
                        )
                      }
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black transition ${
                        gameIndex ===
                        index
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {item.title}
                    </button>
                  )
                )}
              </div>
            )}

            <div className="p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-black text-cyan-300">
                  {finished
                    ? "KẾT QUẢ"
                    : `CÂU ${questionIndex + 1}/${game.questions.length}`}
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
                    Điểm: {score}
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-400">
                    Không tính điểm Quiz
                  </span>
                </div>
              </div>

              {finished ? (
                <div className="py-8 text-center">
                  <CheckCircle2
                    size={60}
                    className="mx-auto text-emerald-400"
                  />

                  <div className="mt-5 text-5xl font-black">
                    {score}/
                    {
                      game.questions.length
                    }
                  </div>

                  <div className="mt-3 text-xl font-black text-amber-300">
                    {Math.round(
                      (score /
                        game.questions.length) *
                        100
                    )}
                    %
                  </div>

                  <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">
                    Đây là hoạt động luyện tập bổ trợ. Kết quả không thay đổi điểm kiểm tra chính của bài học.
                  </p>

                  <button
                    type="button"
                    onClick={
                      resetPlay
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500"
                  >
                    <RotateCcw
                      size={17}
                    />
                    Chơi lại
                  </button>
                </div>
              ) : (
                <>
                  {game.description && (
                    <div className="mb-5 rounded-xl border border-blue-900 bg-[#08233f] p-3 text-xs leading-5 text-slate-400">
                      {game.description}
                    </div>
                  )}

                  <h2 className="text-xl font-black leading-snug sm:text-2xl">
                    {question.prompt}
                  </h2>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {question.answers.map(
                      (
                        answer,
                        answerIndex
                      ) => {
                        const isCorrect =
                          answerIndex ===
                          question.correct;

                        const isSelected =
                          answerIndex ===
                          selected;

                        const stateClass =
                          selected ===
                          null
                            ? "border-blue-800 bg-[#092542] hover:border-cyan-500/70"
                            : isCorrect
                              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-100"
                              : isSelected
                                ? "border-red-500/70 bg-red-500/10 text-red-100"
                                : "border-blue-900 bg-[#092542] opacity-55";

                        return (
                          <button
                            key={`${question.id}-${answerIndex}`}
                            type="button"
                            onClick={() =>
                              choose(
                                answerIndex
                              )
                            }
                            className={`rounded-xl border p-4 text-left text-sm font-bold transition ${stateClass}`}
                          >
                            <span className="mr-2 text-cyan-300">
                              {String.fromCharCode(
                                65 +
                                  answerIndex
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
                    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-blue-800 bg-[#08233f] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-bold text-slate-300">
                        {selected ===
                        question.correct
                          ? "Chính xác! ✓"
                          : "Chưa đúng. Đáp án đúng đã được đánh dấu."}
                      </div>

                      <button
                        type="button"
                        onClick={
                          next
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black hover:bg-blue-500"
                      >
                        {questionIndex ===
                        game.questions.length -
                          1
                          ? "Xem kết quả"
                          : "Câu tiếp theo"}
                        <ChevronRight
                          size={14}
                        />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
