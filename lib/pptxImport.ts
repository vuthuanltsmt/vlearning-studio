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

import type {
  LessonPage,
  ProjectDocument,
} from "@/types/lesson";

type PptxViewerInstance = {
  loadFile: (
    file: File
  ) => Promise<void>;
  render:
    () => Promise<void>;
  nextSlide:
    () => Promise<void>;
  getSlideCount:
    () => number;
};

type PptxViewerConstructor =
  new (
    options: {
      canvas:
        HTMLCanvasElement;
    }
  ) =>
    PptxViewerInstance;

declare global {
  interface Window {
    JSZip?: typeof JSZip;
    PptxViewJS?: {
      PPTXViewer:
        PptxViewerConstructor;
    };
  }
}

const PPTX_VIEWER_SRC =
  "https://cdn.jsdelivr.net/npm/pptxviewjs@1.1.9/dist/PptxViewJS.min.js";

let viewerLoader:
  Promise<PptxViewerConstructor> |
  null =
    null;

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

function loadPptxViewer() {
  if (
    window.PptxViewJS
      ?.PPTXViewer
  ) {
    return Promise.resolve(
      window.PptxViewJS
        .PPTXViewer
    );
  }

  if (
    viewerLoader
  ) {
    return viewerLoader;
  }

  viewerLoader =
    new Promise(
      (
        resolve,
        reject
      ) => {
        window.JSZip =
          JSZip;

        const script =
          document.createElement(
            "script"
          );

        script.src =
          PPTX_VIEWER_SRC;

        script.async =
          true;

        script.onload =
          () => {
            const Viewer =
              window.PptxViewJS
                ?.PPTXViewer;

            if (
              !Viewer
            ) {
              reject(
                new Error(
                  "Không khởi tạo được bộ đọc PowerPoint."
                )
              );

              return;
            }

            resolve(
              Viewer
            );
          };

        script.onerror =
          () =>
            reject(
              new Error(
                "Không tải được bộ đọc PowerPoint. Hãy kiểm tra kết nối Internet."
              )
            );

        document.head.appendChild(
          script
        );
      }
    );

  return viewerLoader;
}

async function extractSlideTitles(
  file: File,
  slideCount: number
) {
  const zip =
    await JSZip.loadAsync(
      file
    );

  const titles:
    string[] =
      [];

  for (
    let index = 0;
    index <
    slideCount;
    index++
  ) {
    const xmlFile =
      zip.file(
        `ppt/slides/slide${index + 1}.xml`
      );

    if (!xmlFile) {
      titles.push(
        `Trang ${index + 1}`
      );
      continue;
    }

    try {
      const xml =
        await xmlFile.async(
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
            "a:t"
          )
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
          : `Trang ${index + 1}`
      );
    } catch {
      titles.push(
        `Trang ${index + 1}`
      );
    }
  }

  return titles;
}

function canvasToBlob(
  canvas: HTMLCanvasElement
) {
  return new Promise<Blob>(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(
              blob
            );
          } else {
            reject(
              new Error(
                "Không tạo được ảnh từ slide."
              )
            );
          }
        },
        "image/png"
      );
    }
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

  const Viewer =
    await loadPptxViewer();

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    1280;

  canvas.height =
    720;

  canvas.style.position =
    "fixed";

  canvas.style.left =
    "-10000px";

  canvas.style.top =
    "-10000px";

  document.body.appendChild(
    canvas
  );

  try {
    const viewer =
      new Viewer({
        canvas,
      });

    await viewer.loadFile(
      file
    );

    await viewer.render();

    const slideCount =
      viewer.getSlideCount();

    if (
      !slideCount ||
      slideCount <
        1
    ) {
      throw new Error(
        "Không tìm thấy slide trong file PPTX."
      );
    }

    const titles =
      await extractSlideTitles(
        file,
        slideCount
      );

    const pages:
      LessonPage[] =
      [];

    let firstSlideBlob:
      Blob | null =
      null;

    for (
      let index = 0;
      index <
      slideCount;
      index++
    ) {
      if (
        index >
        0
      ) {
        await viewer.nextSlide();
        await viewer.render();
      }

      const blob =
        await canvasToBlob(
          canvas
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

      pages.push({
        id:
          pageId,

        title:
          titles[index] ||
          `Trang ${index + 1}`,

        videoName:
          "",

        slideImageName:
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
  } finally {
    canvas.remove();
  }
}
