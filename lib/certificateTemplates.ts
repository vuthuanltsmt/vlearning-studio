import type {
  CertificateTemplateStyle,
  ProjectTheme,
} from "@/types/theme";

export const CERTIFICATE_TEMPLATE_LIBRARY_KEY =
  "vlearning-studio-certificate-template-library-v1";

const MAX_CUSTOM_TEMPLATES =
  8;

export type CertificateTemplateData = Pick<
  ProjectTheme,
  | "certificateTemplateStyle"
  | "certificateKicker"
  | "certificateTitle"
  | "certificateIntro"
  | "certificateCompletionText"
  | "certificateIssuer"
  | "certificateSignerName"
  | "certificateSignerTitle"
  | "certificateFooterText"
  | "certificatePrimaryColor"
  | "certificateAccentColor"
  | "certificateLogoDataUrl"
  | "certificateSignatureDataUrl"
>;

export type SavedCertificateTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: CertificateTemplateData;
};

export type BuiltInCertificateTemplate = {
  id: CertificateTemplateStyle;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
};

export const BUILT_IN_CERTIFICATE_TEMPLATES:
  BuiltInCertificateTemplate[] = [
    {
      id: "classic",
      name: "Mặc định",
      description:
        "Cân đối, dễ dùng cho hầu hết bài học.",
      primaryColor: "#2563eb",
      accentColor: "#8b5cf6",
    },
    {
      id: "formal",
      name: "Trang trọng",
      description:
        "Phong cách truyền thống, xanh navy và vàng.",
      primaryColor: "#1e3a8a",
      accentColor: "#b68b2c",
    },
    {
      id: "school",
      name: "Trường học",
      description:
        "Sáng, thân thiện, phù hợp trường học.",
      primaryColor: "#166534",
      accentColor: "#f59e0b",
    },
    {
      id: "corporate",
      name: "Doanh nghiệp",
      description:
        "Tối giản, hiện đại, phù hợp đào tạo nội bộ.",
      primaryColor: "#0f172a",
      accentColor: "#06b6d4",
    },
  ];

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return (
    "cert-template-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

function normalizeName(
  value: string
) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function captureCertificateTemplate(
  theme: ProjectTheme
): CertificateTemplateData {
  return {
    certificateTemplateStyle:
      theme.certificateTemplateStyle,
    certificateKicker:
      theme.certificateKicker,
    certificateTitle:
      theme.certificateTitle,
    certificateIntro:
      theme.certificateIntro,
    certificateCompletionText:
      theme.certificateCompletionText,
    certificateIssuer:
      theme.certificateIssuer,
    certificateSignerName:
      theme.certificateSignerName,
    certificateSignerTitle:
      theme.certificateSignerTitle,
    certificateFooterText:
      theme.certificateFooterText,
    certificatePrimaryColor:
      theme.certificatePrimaryColor,
    certificateAccentColor:
      theme.certificateAccentColor,
    certificateLogoDataUrl:
      theme.certificateLogoDataUrl,
    certificateSignatureDataUrl:
      theme.certificateSignatureDataUrl,
  };
}

export function applyCertificateTemplateData(
  theme: ProjectTheme,
  data: CertificateTemplateData
): ProjectTheme {
  return {
    ...theme,
    ...data,
  };
}

export function applyBuiltInCertificateTemplate(
  theme: ProjectTheme,
  style: CertificateTemplateStyle
): ProjectTheme {
  /*
   * Logo, issuer, signer and signature are preserved.
   * Built-in templates change visual language only.
   */
  switch (style) {
    case "formal":
      return {
        ...theme,
        certificateTemplateStyle:
          "formal",
        certificateKicker:
          "CERTIFICATE OF ACHIEVEMENT",
        certificateTitle:
          "CHỨNG NHẬN HOÀN THÀNH",
        certificateIntro:
          "Trân trọng chứng nhận",
        certificateCompletionText:
          "đã hoàn thành chương trình học",
        certificatePrimaryColor:
          "#1e3a8a",
        certificateAccentColor:
          "#b68b2c",
      };

    case "school":
      return {
        ...theme,
        certificateTemplateStyle:
          "school",
        certificateKicker:
          "GIẤY CHỨNG NHẬN",
        certificateTitle:
          "CHỨNG NHẬN HOÀN THÀNH KHÓA HỌC",
        certificateIntro:
          "Nhà trường trân trọng chứng nhận",
        certificateCompletionText:
          "đã hoàn thành bài học",
        certificatePrimaryColor:
          "#166534",
        certificateAccentColor:
          "#f59e0b",
      };

    case "corporate":
      return {
        ...theme,
        certificateTemplateStyle:
          "corporate",
        certificateKicker:
          "PROFESSIONAL LEARNING",
        certificateTitle:
          "CHỨNG NHẬN HOÀN THÀNH",
        certificateIntro:
          "Chứng nhận này được trao cho",
        certificateCompletionText:
          "đã hoàn thành chương trình đào tạo",
        certificatePrimaryColor:
          "#0f172a",
        certificateAccentColor:
          "#06b6d4",
      };

    case "classic":
    default:
      return {
        ...theme,
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
        certificatePrimaryColor:
          "",
        certificateAccentColor:
          "",
      };
  }
}

function readTemplates():
  SavedCertificateTemplate[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        CERTIFICATE_TEMPLATE_LIBRARY_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          item.data &&
          typeof item.data === "object"
      )
      .slice(
        0,
        MAX_CUSTOM_TEMPLATES
      ) as SavedCertificateTemplate[];
  } catch (error) {
    console.error(
      "Không đọc được thư viện mẫu chứng nhận:",
      error
    );

    return [];
  }
}

function writeTemplates(
  templates:
    SavedCertificateTemplate[]
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    CERTIFICATE_TEMPLATE_LIBRARY_KEY,
    JSON.stringify(
      templates.slice(
        0,
        MAX_CUSTOM_TEMPLATES
      )
    )
  );
}

export function listSavedCertificateTemplates() {
  return readTemplates();
}

export function saveCertificateTemplate(
  name: string,
  theme: ProjectTheme
) {
  const normalizedName =
    normalizeName(name);

  if (!normalizedName) {
    throw new Error(
      "Tên mẫu không được để trống."
    );
  }

  const templates =
    readTemplates();

  const existing =
    templates.find(
      (item) =>
        item.name.toLocaleLowerCase(
          "vi-VN"
        ) ===
        normalizedName.toLocaleLowerCase(
          "vi-VN"
        )
    );

  const timestamp =
    nowIso();

  let next:
    SavedCertificateTemplate[];

  if (existing) {
    next =
      templates.map(
        (item) =>
          item.id === existing.id
            ? {
                ...item,
                name:
                  normalizedName,
                updatedAt:
                  timestamp,
                data:
                  captureCertificateTemplate(
                    theme
                  ),
              }
            : item
      );
  } else {
    if (
      templates.length >=
      MAX_CUSTOM_TEMPLATES
    ) {
      throw new Error(
        `Chỉ lưu tối đa ${MAX_CUSTOM_TEMPLATES} mẫu cá nhân.`
      );
    }

    next = [
      {
        id:
          makeId(),
        name:
          normalizedName,
        createdAt:
          timestamp,
        updatedAt:
          timestamp,
        data:
          captureCertificateTemplate(
            theme
          ),
      },
      ...templates,
    ];
  }

  writeTemplates(next);
  return next;
}

export function deleteSavedCertificateTemplate(
  templateId: string
) {
  const next =
    readTemplates().filter(
      (item) =>
        item.id !==
        templateId
    );

  writeTemplates(next);
  return next;
}
