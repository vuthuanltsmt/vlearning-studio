"use client";

import JSZip from "jszip";

import {
  convertPptxToSvg,
} from "pptx-glimpse";

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

async function getSlideTitles(
  file: File
) {
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

  for (
    let index = 0;
    index <
    slideNames.length;
    index++
  ) {
    const slideFile =
      zip.file(
        slideNames[index]
      );

    if (!slideFile) {
      titles.push(
        `Trang ${index + 1}`
      );

      continue;
    }

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

  const [
    bytes,
    titles,
  ] =
    await Promise.all([
      file
        .arrayBuffer()
        .then(
          (buffer) =>
            new Uint8Array(
              buffer
            )
        ),

      getSlideTitles(
        file
      ),
    ]);

  const report =
    await convertPptxToSvg(
      bytes,
      {
        textOutput:
          "text",

        logLevel:
          "off",
      }
    );

  if (
    !report.slides ||
    report.slides.length <
      1
  ) {
    throw new Error(
      "Không render được slide từ file PPTX."
    );
  }

  const pages:
    LessonPage[] =
      [];

  let firstSlideBlob:
    Blob | null =
    null;

  for (
    let index = 0;
    index <
    report.slides.length;
    index++
  ) {
    const rendered =
      report.slides[
        index
      ];

    if (
      !rendered?.svg
    ) {
      throw new Error(
        `Không render được slide ${index + 1}.`
      );
    }

    const blob =
      new Blob(
        [
          rendered.svg,
        ],
        {
          type:
            "image/svg+xml",
        }
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
        `slide-${index + 1}.svg`,

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

  if (
    report.diagnostics
      ?.length
  ) {
    console.info(
      "PPTX diagnostics:",
      report.diagnostics
    );
  }

  return project;
}
