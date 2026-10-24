"use client";

import JSZip from "jszip";

import {
  setActiveProject,
} from "@/lib/projectLibrary";

import {
  saveProjectThumbnail,
} from "@/lib/projectThumbnailDb";

import {
  saveSlideImage,
} from "@/lib/slideImageDb";

import {
  saveVideo,
} from "@/lib/videoDb";

import type {
  LessonPage,
  ProjectDocument,
} from "@/types/lesson";

type StartResponse = {
  ok: boolean;
  error?: string;
  jobId?: string;
  upload?: {
    url: string;
    parameters: Record<
      string,
      string
    >;
  };
};

type StatusResponse = {
  ok: boolean;
  error?: string;
  status?: string;
  files?: Array<{
    index: number;
    filename: string;
  }>;
};

function createId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `pptx-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function fileTitle(
  fileName: string
) {
  return fileName
    .replace(
      /\.pptx$/i,
      ""
    )
    .trim() ||
    "Bài giảng PowerPoint";
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

type EmbeddedVideo = {
  fileName: string;
  file: File;
};

type PptxInspection = {
  titles: string[];
  videosBySlide:
    Map<
      number,
      EmbeddedVideo[]
    >;
};

const VIDEO_EXTENSIONS =
  new Set([
    "mp4",
    "mov",
    "m4v",
    "webm",
    "avi",
    "wmv",
    "mpeg",
    "mpg",
  ]);

function mediaMimeType(
  fileName: string
) {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase();

  switch (
    extension
  ) {
    case "webm":
      return "video/webm";

    case "mov":
      return "video/quicktime";

    case "m4v":
      return "video/x-m4v";

    case "avi":
      return "video/x-msvideo";

    case "wmv":
      return "video/x-ms-wmv";

    case "mpeg":
    case "mpg":
      return "video/mpeg";

    case "mp4":
    default:
      return "video/mp4";
  }
}

function normalizeSlideMediaTarget(
  target: string
) {
  const normalized =
    target
      .replace(
        /\\/g,
        "/"
      )
      .replace(
        /^\.\.\//,
        ""
      );

  if (
    normalized.startsWith(
      "ppt/"
    )
  ) {
    return normalized;
  }

  if (
    normalized.startsWith(
      "media/"
    )
  ) {
    return `ppt/${normalized}`;
  }

  return `ppt/slides/${normalized}`;
}

async function inspectPptx(
  file: File
): Promise<PptxInspection> {
  const zip =
    await JSZip.loadAsync(
      file
    );

  const slideNames =
    Object.keys(
      zip.files
    )
      .filter(
        (name) =>
          /^ppt\/slides\/slide\d+\.xml$/.test(
            name
          )
      )
      .sort(
        (
          a,
          b
        ) => {
          const aNumber =
            Number(
              a.match(
                /slide(\d+)\.xml$/
              )?.[1] ??
              0
            );

          const bNumber =
            Number(
              b.match(
                /slide(\d+)\.xml$/
              )?.[1] ??
              0
            );

          return (
            aNumber -
            bNumber
          );
        }
      );

  const titles:
    string[] =
      [];

  const videosBySlide =
    new Map<
      number,
      EmbeddedVideo[]
    >();

  for (
    let index = 0;
    index <
    slideNames.length;
    index++
  ) {
    const slideNumber =
      index +
      1;

    const slideFile =
      zip.file(
        slideNames[index]
      );

    if (!slideFile) {
      titles.push(
        `Trang ${slideNumber}`
      );
    } else {
      try {
        const xml =
          await slideFile.async(
            "string"
          );

        const documentXml =
          new DOMParser().parseFromString(
            xml,
            "application/xml"
          );

        const texts =
          Array.from(
            documentXml.getElementsByTagName(
              "*"
            )
          )
            .filter(
              (node) =>
                node.localName ===
                "t"
            )
            .map(
              (node) =>
                String(
                  node.textContent ??
                  ""
                ).trim()
            )
            .filter(Boolean);

        titles.push(
          texts[0]
            ? texts[0].slice(
                0,
                100
              )
            : `Trang ${slideNumber}`
        );
      } catch {
        titles.push(
          `Trang ${slideNumber}`
        );
      }
    }

    const relsFile =
      zip.file(
        `ppt/slides/_rels/slide${slideNumber}.xml.rels`
      );

    if (!relsFile) {
      continue;
    }

    try {
      const relsXml =
        await relsFile.async(
          "string"
        );

      const relsDocument =
        new DOMParser().parseFromString(
          relsXml,
          "application/xml"
        );

      const relationships =
        Array.from(
          relsDocument.getElementsByTagName(
            "*"
          )
        ).filter(
          (node) =>
            node.localName ===
            "Relationship"
        );

      const videos:
        EmbeddedVideo[] =
        [];

      const seenPaths =
        new Set<string>();

      for (
        const relationship of
        relationships
      ) {
        const target =
          relationship.getAttribute(
            "Target"
          ) ??
          "";

        if (!target) {
          continue;
        }

        const mediaPath =
          normalizeSlideMediaTarget(
            target
          );

        const extension =
          mediaPath
            .split(".")
            .pop()
            ?.toLowerCase() ??
          "";

        if (
          !VIDEO_EXTENSIONS.has(
            extension
          ) ||
          seenPaths.has(
            mediaPath
          )
        ) {
          continue;
        }

        const mediaFile =
          zip.file(
            mediaPath
          );

        if (!mediaFile) {
          continue;
        }

        const bytes =
          await mediaFile.async(
            "uint8array"
          );

        const safeBytes =
          new Uint8Array(
            bytes.byteLength
          );

        safeBytes.set(
          bytes
        );

        const fileName =
          mediaPath
            .split("/")
            .pop() ??
          `slide-${slideNumber}-video.${extension || "mp4"}`;

        videos.push({
          fileName,
          file:
            new File(
              [
                safeBytes.buffer,
              ],
              fileName,
              {
                type:
                  mediaMimeType(
                    fileName
                  ),
              }
            ),
        });

        seenPaths.add(
          mediaPath
        );
      }

      if (
        videos.length >
        0
      ) {
        videosBySlide.set(
          index,
          videos
        );
      }
    } catch (
      error
    ) {
      console.warn(
        `Không đọc được video nhúng của slide ${slideNumber}:`,
        error
      );
    }
  }

  return {
    titles,
    videosBySlide,
  };
}

async function createConversionJob() {
  const response =
    await fetch(
      "/api/pptx/start",
      {
        method:
          "POST",
        credentials:
          "same-origin",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({}),
      }
    );

  const payload =
    await response.json()
      .catch(
        () =>
          null
      ) as
      StartResponse |
      null;

  if (
    !response.ok ||
    !payload?.ok ||
    !payload.jobId ||
    !payload.upload?.url
  ) {
    throw new Error(
      payload?.error ||
      "Không tạo được tác vụ chuyển đổi PowerPoint."
    );
  }

  return {
    jobId:
      payload.jobId,
    upload:
      payload.upload,
  };
}

async function uploadToCloudConvert(
  file: File,
  upload: {
    url: string;
    parameters: Record<
      string,
      string
    >;
  }
) {
  const form =
    new FormData();

  Object.entries(
    upload.parameters
  ).forEach(
    (
      [
        key,
        value,
      ]
    ) => {
      form.append(
        key,
        value
      );
    }
  );

  form.append(
    "file",
    file,
    file.name
  );

  const response =
    await fetch(
      upload.url,
      {
        method:
          "POST",
        body:
          form,
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "Không upload được PowerPoint lên CloudConvert."
    );
  }
}

async function waitForConversion(
  jobId: string
) {
  const maxAttempts =
    120;

  for (
    let attempt = 0;
    attempt <
    maxAttempts;
    attempt++
  ) {
    const response =
      await fetch(
        `/api/pptx/status?jobId=${encodeURIComponent(
          jobId
        )}`,
        {
          credentials:
            "same-origin",
          cache:
            "no-store",
        }
      );

    const payload =
      await response.json()
        .catch(
          () =>
            null
        ) as
        StatusResponse |
        null;

    if (
      !response.ok ||
      !payload?.ok
    ) {
      throw new Error(
        payload?.error ||
        "Không đọc được trạng thái chuyển đổi PowerPoint."
      );
    }

    if (
      payload.status ===
      "finished"
    ) {
      if (
        !payload.files ||
        payload.files.length <
          1
      ) {
        throw new Error(
          "CloudConvert hoàn tất nhưng không trả về ảnh slide."
        );
      }

      return payload.files;
    }

    await sleep(
      1500
    );
  }

  throw new Error(
    "Chuyển đổi PowerPoint mất quá nhiều thời gian. Vui lòng thử lại."
  );
}

async function downloadSlide(
  jobId: string,
  index: number
) {
  const maxAttempts =
    3;

  let lastMessage =
    `Không tải được ảnh slide ${index + 1}.`;

  for (
    let attempt = 0;
    attempt <
    maxAttempts;
    attempt++
  ) {
    const response =
      await fetch(
        `/api/pptx/file?jobId=${encodeURIComponent(
          jobId
        )}&index=${index}`,
        {
          credentials:
            "same-origin",
          cache:
            "no-store",
        }
      );

    if (
      response.ok
    ) {
      return await response.blob();
    }

    const payload =
      await response.json()
        .catch(
          () =>
            null
        );

    lastMessage =
      payload?.error ||
      lastMessage;

    if (
      attempt <
      maxAttempts -
        1
    ) {
      await sleep(
        900 *
          (
            attempt +
            1
          )
      );
    }
  }

  throw new Error(
    lastMessage
  );
}

export async function importPptxAsProject(
  file: File
): Promise<ProjectDocument> {
  if (
    !file.name
      .toLowerCase()
      .endsWith(
        ".pptx"
      )
  ) {
    throw new Error(
      "Vui lòng chọn file PowerPoint .pptx."
    );
  }

  const inspectionPromise =
    inspectPptx(
      file
    );

  const {
    jobId,
    upload,
  } =
    await createConversionJob();

  await uploadToCloudConvert(
    file,
    upload
  );

  const files =
    await waitForConversion(
      jobId
    );

  const inspection =
    await inspectionPromise;

  const titles =
    inspection.titles;

  const pages:
    LessonPage[] =
      [];

  let firstSlideBlob:
    Blob | null =
    null;

  for (
    let index = 0;
    index <
    files.length;
    index++
  ) {
    const blob =
      await downloadSlide(
        jobId,
        index
      );

    const pageId =
      createId();

    await saveSlideImage(
      pageId,
      blob
    );

    if (
      index ===
      0
    ) {
      firstSlideBlob =
        blob;
    }

    const embeddedVideos =
      inspection.videosBySlide.get(
        index
      ) ??
      [];

    const embeddedVideo =
      embeddedVideos[0] ??
      null;

    if (
      embeddedVideos.length >
      1
    ) {
      console.warn(
        `Slide ${index + 1} có ${embeddedVideos.length} video. VLEARNING hiện chỉ tự gắn video đầu tiên.`
      );
    }

    let videoUrl:
      string |
      undefined =
      undefined;

    if (
      embeddedVideo
    ) {
      try {
        await saveVideo(
          pageId,
          embeddedVideo.file
        );

        videoUrl =
          URL.createObjectURL(
            embeddedVideo.file
          );
      } catch (
        error
      ) {
        console.error(
          `Không lưu được video nhúng của slide ${index + 1}:`,
          error
        );
      }
    }

    pages.push({
      id:
        pageId,

      title:
        titles[index] ||
        `Trang ${index + 1}`,

      videoName:
        embeddedVideo
          ?.fileName ??
        "",

      videoUrl,

      slideImageName:
        files[index]
          ?.filename ||
        `slide-${index + 1}.png`,

      duration:
        10,

      quizzes:
        [],
    });
  }

  const project:
    ProjectDocument = {
      id:
        createId(),

      title:
        fileTitle(
          file.name
        ),

      selectedPageId:
        pages[0].id,

      pages,
    };

  setActiveProject(
    project
  );

  if (
    firstSlideBlob
  ) {
    try {
      await saveProjectThumbnail(
        project.id,
        firstSlideBlob
      );
    } catch (
      error
    ) {
      console.warn(
        "Không tạo được thumbnail PPTX:",
        error
      );
    }
  }

  return project;
}
