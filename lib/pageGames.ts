"use client";

export type PageGameQuestion = {
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

export type PageGame = {
  id: string;
  title: string;
  description: string;
  questions: PageGameQuestion[];
  updatedAt: string;
};

type PageGameLink = {
  id: string;
  gameId: string;
  projectId: string;
  pageId: string;
  attachedAt: string;
};

export const GAME_LIBRARY_KEY =
  "vlearning-game-library-v1";

export const GAME_LINKS_KEY =
  "vlearning-project-game-links-v1";

function normalizeGames(
  raw: unknown
): PageGame[] {
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

      const source =
        entry as Partial<PageGame>;

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
              question as Partial<PageGameQuestion>;

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

function normalizeLinks(
  raw: unknown
): PageGameLink[] {
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
        entry as Partial<PageGameLink>;

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
              : "",
        },
      ];
    }
  );
}

export function loadGamesForPage(
  projectId: string,
  pageId: string
): PageGame[] {
  if (
    typeof window ===
      "undefined" ||
    !projectId ||
    !pageId
  ) {
    return [];
  }

  try {
    const games =
      normalizeGames(
        JSON.parse(
          localStorage.getItem(
            GAME_LIBRARY_KEY
          ) || "[]"
        )
      );

    const links =
      normalizeLinks(
        JSON.parse(
          localStorage.getItem(
            GAME_LINKS_KEY
          ) || "[]"
        )
      );

    const linkedIds =
      new Set(
        links
          .filter(
            (link) =>
              link.projectId ===
                projectId &&
              link.pageId ===
                pageId
          )
          .map(
            (link) =>
              link.gameId
          )
      );

    return games.filter(
      (game) =>
        linkedIds.has(
          game.id
        )
    );
  } catch {
    return [];
  }
}
