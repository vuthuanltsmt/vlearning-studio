import {
  AuthError,
  serverUserForGuard,
} from "@/lib/authServer";

import {
  canAuthor,
} from "@/lib/permissions";

const API_BASE =
  "https://api.cloudconvert.com/v2";

const TAG_PREFIX =
  "vlearning-pptx";

type CloudConvertFile = {
  filename?: string;
  url?: string;
};

type CloudConvertTask = {
  id?: string;
  name?: string;
  operation?: string;
  status?: string;
  message?: string;
  result?: {
    form?: {
      url?: string;
      parameters?: Record<
        string,
        string
      >;
    };
    files?:
      CloudConvertFile[];
  };
};

export type CloudConvertJob = {
  id: string;
  tag?: string;
  status: string;
  tasks: CloudConvertTask[];
};

function apiKey() {
  const value =
    process.env.CLOUDCONVERT_API_KEY?.trim();

  if (!value) {
    throw new Error(
      "CLOUDCONVERT_API_KEY chưa được cấu hình."
    );
  }

  return value;
}

function headers() {
  return {
    Authorization:
      `Bearer ${apiKey()}`,
    "Content-Type":
      "application/json",
  };
}

export async function requirePptxAuthor() {
  const user =
    await serverUserForGuard();

  if (!user) {
    throw new AuthError(
      "Chưa đăng nhập.",
      401
    );
  }

  if (
    !canAuthor(
      user.accessRole
    )
  ) {
    throw new AuthError(
      "Tài khoản không có quyền nhập PowerPoint.",
      403
    );
  }

  return user;
}

export async function createPptxConversionJob(
  userId: string
) {
  const response =
    await fetch(
      `${API_BASE}/jobs`,
      {
        method:
          "POST",
        headers:
          headers(),
        body:
          JSON.stringify({
            tasks: {
              "upload-pptx": {
                operation:
                  "import/upload",
              },

              "convert-slides": {
                operation:
                  "convert",
                input:
                  "upload-pptx",
                input_format:
                  "pptx",
                output_format:
                  "png",
              },

              "export-slides": {
                operation:
                  "export/url",
                input:
                  "convert-slides",
                inline:
                  false,
                archive_multiple_files:
                  false,
              },
            },

            tag:
              `${TAG_PREFIX}:${userId}:${Date.now()}`,
          }),
        cache:
          "no-store",
      }
    );

  const payload =
    await response.json()
      .catch(
        () =>
          null
      );

  if (
    !response.ok ||
    !payload?.data
  ) {
    console.error(
      "[PPTX] CloudConvert create job failed:",
      payload
    );

    throw new Error(
      "Không tạo được tác vụ chuyển đổi PowerPoint."
    );
  }

  const job =
    payload.data as
      CloudConvertJob;

  const uploadTask =
    job.tasks.find(
      (task) =>
        task.name ===
          "upload-pptx" ||
        task.operation ===
          "import/upload"
    );

  const form =
    uploadTask?.result
      ?.form;

  if (
    !form?.url ||
    !form.parameters
  ) {
    throw new Error(
      "CloudConvert không trả về thông tin upload."
    );
  }

  return {
    jobId:
      job.id,
    upload: {
      url:
        form.url,
      parameters:
        form.parameters,
    },
  };
}

export async function getPptxJob(
  jobId: string
) {
  const cleanId =
    jobId.trim();

  if (
    !cleanId ||
    !/^[a-zA-Z0-9-]+$/.test(
      cleanId
    )
  ) {
    throw new AuthError(
      "Mã tác vụ không hợp lệ.",
      400
    );
  }

  const response =
    await fetch(
      `${API_BASE}/jobs/${encodeURIComponent(
        cleanId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${apiKey()}`,
        },
        cache:
          "no-store",
      }
    );

  const payload =
    await response.json()
      .catch(
        () =>
          null
      );

  if (
    !response.ok ||
    !payload?.data
  ) {
    throw new Error(
      "Không đọc được trạng thái chuyển đổi PowerPoint."
    );
  }

  return payload.data as
    CloudConvertJob;
}

export function assertJobOwner(
  job: CloudConvertJob,
  userId: string
) {
  if (
    !job.tag?.startsWith(
      `${TAG_PREFIX}:${userId}:`
    )
  ) {
    throw new AuthError(
      "Không có quyền truy cập tác vụ này.",
      403
    );
  }
}

function naturalFileNumber(
  name: string
) {
  const matches =
    name.match(
      /(\d+)(?!.*\d)/
    );

  return matches
    ? Number(
        matches[1]
      )
    : Number.MAX_SAFE_INTEGER;
}

export function exportedPngFiles(
  job: CloudConvertJob
) {
  const exportTask =
    job.tasks.find(
      (task) =>
        task.name ===
          "export-slides" ||
        task.operation ===
          "export/url"
    );

  const files =
    exportTask?.result
      ?.files ??
    [];

  return files
    .filter(
      (file) =>
        Boolean(
          file.url
        )
    )
    .sort(
      (
        a,
        b
      ) => {
        const nameA =
          a.filename ??
          "";

        const nameB =
          b.filename ??
          "";

        const numberA =
          naturalFileNumber(
            nameA
          );

        const numberB =
          naturalFileNumber(
            nameB
          );

        if (
          numberA !==
          numberB
        ) {
          return (
            numberA -
            numberB
          );
        }

        return nameA.localeCompare(
          nameB
        );
      }
    );
}

export function jobErrorMessage(
  job: CloudConvertJob
) {
  const failed =
    job.tasks.find(
      (task) =>
        task.status ===
        "error"
    );

  return (
    failed?.message ||
    "CloudConvert không thể chuyển đổi file PowerPoint."
  );
}
