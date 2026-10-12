import type {
  CertificateTemplateStyle,
  ProjectTheme,
  ThemeButtonStyle,
  ThemeFont,
  ThemeMode,
} from "@/types/theme";

const STORAGE_KEY =
  "vlearning-studio-project-theme-v1";

const CHANGE_EVENT =
  "vlearning-project-theme-changed";

type ThemeMap =
  Record<string, ProjectTheme>;

const HEX_COLOR =
  /^#[0-9a-fA-F]{6}$/;

const VALID_MODES: ThemeMode[] = [
  "dark",
  "light",
];

const VALID_FONTS: ThemeFont[] = [
  "system",
  "sans",
  "serif",
];

const VALID_BUTTON_STYLES: ThemeButtonStyle[] = [
  "rounded",
  "pill",
  "square",
];

const VALID_CERTIFICATE_TEMPLATE_STYLES:
  CertificateTemplateStyle[] = [
    "classic",
    "formal",
    "school",
    "corporate",
  ];

/* =========================================================
   DEFAULT
========================================================= */

export function createDefaultProjectTheme(
  projectTitle = ""
): ProjectTheme {
  return {
    version: 1,
    courseTitle:
      projectTitle,
    mode: "dark",
    primaryColor:
      "#2563eb",
    accentColor:
      "#8b5cf6",
    backgroundColor:
      "#07182c",
    surfaceColor:
      "#102b52",
    textColor:
      "#ffffff",
    fontFamily:
      "system",
    buttonStyle:
      "rounded",
    playerRadius: 16,
    showProgress: true,
    showPageNavigation: true,

    courseIntroEnabled:
      true,
    courseIntroEyebrow:
      "BÀI HỌC TƯƠNG TÁC",
    courseIntroDescription:
      "Khám phá nội dung bài học, hoàn thành các câu hỏi tương tác và theo dõi tiến độ học tập của bạn.",
    courseIntroObjectives:
      "Nắm vững kiến thức trọng tâm\nHoàn thành các câu hỏi tương tác\nTheo dõi tiến độ và kết quả học tập",
    courseIntroButtonLabel:
      "Bắt đầu học",
    courseIntroCoverDataUrl:
      "",

    courseOutroEnabled:
      true,
    courseOutroEyebrow:
      "HOÀN THÀNH BÀI HỌC",
    courseOutroPassTitle:
      "Chúc mừng! Bạn đã hoàn thành bài học.",
    courseOutroFailTitle:
      "Bạn đã hoàn thành lượt học.",
    courseOutroPassMessage:
      "Bạn đã đạt yêu cầu của bài học. Hãy lưu kết quả hoặc xem chứng nhận hoàn thành của bạn.",
    courseOutroFailMessage:
      "Kết quả hiện tại chưa đạt yêu cầu. Bạn có thể xem lại nội dung và học lại để cải thiện kết quả.",
    courseOutroButtonLabel:
      "Xem trang kết thúc",

    certificateTemplateStyle:
      "classic",
    certificateKicker:
      "CERTIFICATE OF COMPLETION",
    certificateTitle:
      "CHỨNG NHẬN HOÀN THÀNH",
    certificateIntro:
      "Trân trọng chứng nhận",
    certificateCompletionText:
      "đã hoàn thành bài học",
    certificateIssuer:
      "VLearning Studio",
    certificateSignerName:
      "",
    certificateSignerTitle:
      "Người xác nhận",
    certificateFooterText:
      "",
    certificatePrimaryColor:
      "",
    certificateAccentColor:
      "",
    certificateLogoDataUrl:
      "",
    certificateSignatureDataUrl:
      "",
  };
}

/* =========================================================
   HELPERS
========================================================= */

function readThemeMap(): ThemeMap {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as ThemeMap;
  } catch (
    error
  ) {
    console.error(
      "Không thể đọc thiết kế dự án:",
      error
    );

    return {};
  }
}

function writeThemeMap(
  map: ThemeMap
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(map)
  );
}

function normalizeColor(
  value: unknown,
  fallback: string
) {
  return typeof value ===
      "string" &&
    HEX_COLOR.test(value)
    ? value.toLowerCase()
    : fallback;
}

function normalizeOptionalColor(
  value: unknown
) {
  if (
    value ===
    "" ||
    value == null
  ) {
    return "";
  }

  return typeof value ===
      "string" &&
    HEX_COLOR.test(value)
    ? value.toLowerCase()
    : "";
}

function normalizeText(
  value: unknown,
  fallback: string,
  maxLength = 180
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  return value
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .slice(
      0,
      maxLength
    );
}

function normalizeMultilineText(
  value: unknown,
  fallback: string,
  maxLength = 800
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  return value
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .split(
      "\n"
    )
    .map(
      (
        line
      ) =>
        line
          .replace(
            /\s+/g,
            " "
          )
          .trim()
    )
    .filter(
      Boolean
    )
    .join(
      "\n"
    )
    .slice(
      0,
      maxLength
    );
}

function normalizeImageDataUrl(
  value: unknown
) {
  if (
    typeof value !==
    "string" ||
    !value
  ) {
    return "";
  }

  /*
   * Keep localStorage safe:
   * accept only common image data URLs,
   * capped to about 1.2 MB of encoded text.
   */
  if (
    value.length >
      1_250_000 ||
    !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(
      value
    )
  ) {
    return "";
  }

  return value;
}

function normalizeProjectTheme(
  value: Partial<ProjectTheme> | null | undefined,
  projectTitle = ""
): ProjectTheme {
  const defaults =
    createDefaultProjectTheme(
      projectTitle
    );

  const mode =
    VALID_MODES.includes(
      value?.mode as ThemeMode
    )
      ? (value?.mode as ThemeMode)
      : defaults.mode;

  const fontFamily =
    VALID_FONTS.includes(
      value?.fontFamily as ThemeFont
    )
      ? (value?.fontFamily as ThemeFont)
      : defaults.fontFamily;

  const buttonStyle =
    VALID_BUTTON_STYLES.includes(
      value?.buttonStyle as ThemeButtonStyle
    )
      ? (value?.buttonStyle as ThemeButtonStyle)
      : defaults.buttonStyle;

  const rawRadius =
    Number(value?.playerRadius);

  const playerRadius =
    Number.isFinite(rawRadius)
      ? Math.min(
          32,
          Math.max(
            0,
            Math.round(rawRadius)
          )
        )
      : defaults.playerRadius;

  return {
    version: 1,
    courseTitle:
      typeof value?.courseTitle ===
        "string"
        ? value.courseTitle
        : defaults.courseTitle,
    mode,
    primaryColor:
      normalizeColor(
        value?.primaryColor,
        defaults.primaryColor
      ),
    accentColor:
      normalizeColor(
        value?.accentColor,
        defaults.accentColor
      ),
    backgroundColor:
      normalizeColor(
        value?.backgroundColor,
        defaults.backgroundColor
      ),
    surfaceColor:
      normalizeColor(
        value?.surfaceColor,
        defaults.surfaceColor
      ),
    textColor:
      normalizeColor(
        value?.textColor,
        defaults.textColor
      ),
    fontFamily,
    buttonStyle,
    playerRadius,
    showProgress:
      typeof value?.showProgress ===
        "boolean"
        ? value.showProgress
        : defaults.showProgress,
    showPageNavigation:
      typeof value?.showPageNavigation ===
        "boolean"
        ? value.showPageNavigation
        : defaults.showPageNavigation,

    courseIntroEnabled:
      typeof value?.courseIntroEnabled ===
        "boolean"
        ? value.courseIntroEnabled
        : defaults.courseIntroEnabled,
    courseIntroEyebrow:
      normalizeText(
        value?.courseIntroEyebrow,
        defaults.courseIntroEyebrow,
        100
      ),
    courseIntroDescription:
      normalizeMultilineText(
        value?.courseIntroDescription,
        defaults.courseIntroDescription,
        700
      ),
    courseIntroObjectives:
      normalizeMultilineText(
        value?.courseIntroObjectives,
        defaults.courseIntroObjectives,
        900
      ),
    courseIntroButtonLabel:
      normalizeText(
        value?.courseIntroButtonLabel,
        defaults.courseIntroButtonLabel,
        60
      ),
    courseIntroCoverDataUrl:
      normalizeImageDataUrl(
        value?.courseIntroCoverDataUrl
      ),

    courseOutroEnabled:
      typeof value?.courseOutroEnabled ===
        "boolean"
        ? value.courseOutroEnabled
        : defaults.courseOutroEnabled,
    courseOutroEyebrow:
      normalizeText(
        value?.courseOutroEyebrow,
        defaults.courseOutroEyebrow,
        100
      ),
    courseOutroPassTitle:
      normalizeText(
        value?.courseOutroPassTitle,
        defaults.courseOutroPassTitle,
        180
      ),
    courseOutroFailTitle:
      normalizeText(
        value?.courseOutroFailTitle,
        defaults.courseOutroFailTitle,
        180
      ),
    courseOutroPassMessage:
      normalizeMultilineText(
        value?.courseOutroPassMessage,
        defaults.courseOutroPassMessage,
        700
      ),
    courseOutroFailMessage:
      normalizeMultilineText(
        value?.courseOutroFailMessage,
        defaults.courseOutroFailMessage,
        700
      ),
    courseOutroButtonLabel:
      normalizeText(
        value?.courseOutroButtonLabel,
        defaults.courseOutroButtonLabel,
        80
      ),

    certificateTemplateStyle:
      VALID_CERTIFICATE_TEMPLATE_STYLES.includes(
        value?.certificateTemplateStyle as
          CertificateTemplateStyle
      )
        ? (
            value?.certificateTemplateStyle as
              CertificateTemplateStyle
          )
        : defaults.certificateTemplateStyle,

    certificateKicker:
      normalizeText(
        value?.certificateKicker,
        defaults.certificateKicker,
        80
      ),
    certificateTitle:
      normalizeText(
        value?.certificateTitle,
        defaults.certificateTitle,
        120
      ),
    certificateIntro:
      normalizeText(
        value?.certificateIntro,
        defaults.certificateIntro,
        140
      ),
    certificateCompletionText:
      normalizeText(
        value?.certificateCompletionText,
        defaults.certificateCompletionText,
        140
      ),
    certificateIssuer:
      normalizeText(
        value?.certificateIssuer,
        defaults.certificateIssuer,
        160
      ),
    certificateSignerName:
      normalizeText(
        value?.certificateSignerName,
        defaults.certificateSignerName,
        120
      ),
    certificateSignerTitle:
      normalizeText(
        value?.certificateSignerTitle,
        defaults.certificateSignerTitle,
        120
      ),
    certificateFooterText:
      normalizeText(
        value?.certificateFooterText,
        defaults.certificateFooterText,
        180
      ),
    certificatePrimaryColor:
      normalizeOptionalColor(
        value?.certificatePrimaryColor
      ),
    certificateAccentColor:
      normalizeOptionalColor(
        value?.certificateAccentColor
      ),
    certificateLogoDataUrl:
      normalizeImageDataUrl(
        value?.certificateLogoDataUrl
      ),
    certificateSignatureDataUrl:
      normalizeImageDataUrl(
        value?.certificateSignatureDataUrl
      ),
  };
}

function notifyThemeChanged(
  projectId: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      CHANGE_EVENT,
      {
        detail: {
          projectId,
        },
      }
    )
  );
}

/* =========================================================
   PUBLIC API
========================================================= */

export function loadProjectThemeForProject(
  projectId: string,
  projectTitle = ""
): ProjectTheme {
  const map =
    readThemeMap();

  return normalizeProjectTheme(
    map[projectId],
    projectTitle
  );
}

export function saveProjectThemeForProject(
  projectId: string,
  theme: ProjectTheme,
  projectTitle = ""
): ProjectTheme {
  const normalized =
    normalizeProjectTheme(
      theme,
      projectTitle
    );

  const map =
    readThemeMap();

  map[projectId] =
    normalized;

  writeThemeMap(map);
  notifyThemeChanged(projectId);

  return normalized;
}

export function resetProjectThemeForProject(
  projectId: string,
  projectTitle = ""
): ProjectTheme {
  const map =
    readThemeMap();

  delete map[projectId];

  writeThemeMap(map);
  notifyThemeChanged(projectId);

  return createDefaultProjectTheme(
    projectTitle
  );
}

export function copyProjectTheme(
  sourceProjectId: string,
  targetProjectId: string,
  targetProjectTitle = ""
) {
  const map =
    readThemeMap();

  const source =
    map[sourceProjectId];

  if (!source) {
    return false;
  }

  map[targetProjectId] =
    normalizeProjectTheme(
      {
        ...source,
        courseTitle:
          targetProjectTitle ||
          source.courseTitle,
      },
      targetProjectTitle
    );

  writeThemeMap(map);
  notifyThemeChanged(
    targetProjectId
  );

  return true;
}

export function deleteProjectTheme(
  projectId: string
) {
  const map =
    readThemeMap();

  if (!map[projectId]) {
    return;
  }

  delete map[projectId];

  writeThemeMap(map);
  notifyThemeChanged(projectId);
}

export function getProjectThemeChangeEventName() {
  return CHANGE_EVENT;
}
