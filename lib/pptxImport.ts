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

const DEFAULT_SLIDE_CX =
  12192000;

const DEFAULT_SLIDE_CY =
  6858000;

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

function escapeXml(
  value: string
) {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );
}

function getDirectChildrenByLocalName(
  element: Element,
  localName: string
) {
  return Array.from(
    element.children
  ).filter(
    (child) =>
      child.localName ===
      localName
  );
}

function firstDescendant(
  element: Element,
  localName: string
) {
  return Array.from(
    element.getElementsByTagName(
      "*"
    )
  ).find(
    (child) =>
      child.localName ===
      localName
  ) ?? null;
}

function attrNumber(
  element:
    Element |
    null,
  name: string,
  fallback = 0
) {
  if (!element) {
    return fallback;
  }

  const value =
    Number(
      element.getAttribute(
        name
      )
    );

  return Number.isFinite(
    value
  )
    ? value
    : fallback;
}

async function getSlideSize(
  zip: JSZip
) {
  const file =
    zip.file(
      "ppt/presentation.xml"
    );

  if (!file) {
    return {
      cx:
        DEFAULT_SLIDE_CX,
      cy:
        DEFAULT_SLIDE_CY,
    };
  }

  try {
    const xml =
      await file.async(
        "string"
      );

    const documentXml =
      new DOMParser().parseFromString(
        xml,
        "application/xml"
      );

    const size =
      Array.from(
        documentXml.getElementsByTagName(
          "*"
        )
      ).find(
        (node) =>
          node.localName ===
          "sldSz"
      );

    return {
      cx:
        attrNumber(
          size ?? null,
          "cx",
          DEFAULT_SLIDE_CX
        ),
      cy:
        attrNumber(
          size ?? null,
          "cy",
          DEFAULT_SLIDE_CY
        ),
    };
  } catch {
    return {
      cx:
        DEFAULT_SLIDE_CX,
      cy:
        DEFAULT_SLIDE_CY,
    };
  }
}

function mimeFromPath(
  path: string
) {
  const extension =
    path
      .split(".")
      .pop()
      ?.toLowerCase();

  switch (
    extension
  ) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";

    case "gif":
      return "image/gif";

    case "svg":
      return "image/svg+xml";

    case "webp":
      return "image/webp";

    default:
      return "image/png";
  }
}

async function blobToDataUrl(
  blob: Blob
) {
  return await new Promise<
    string
  >(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onload =
        () => {
          if (
            typeof reader.result ===
            "string"
          ) {
            resolve(
              reader.result
            );
          } else {
            reject(
              new Error(
                "Không đọc được ảnh trong PowerPoint."
              )
            );
          }
        };

      reader.onerror =
        () =>
          reject(
            reader.error ??
              new Error(
                "Không đọc được ảnh trong PowerPoint."
              )
          );

      reader.readAsDataURL(
        blob
      );
    }
  );
}

async function getRelationships(
  zip: JSZip,
  slideNumber: number
) {
  const relsFile =
    zip.file(
      `ppt/slides/_rels/slide${slideNumber}.xml.rels`
    );

  const result =
    new Map<
      string,
      string
    >();

  if (!relsFile) {
    return result;
  }

  const xml =
    await relsFile.async(
      "string"
    );

  const documentXml =
    new DOMParser().parseFromString(
      xml,
      "application/xml"
    );

  Array.from(
    documentXml.getElementsByTagName(
      "*"
    )
  )
    .filter(
      (node) =>
        node.localName ===
        "Relationship"
    )
    .forEach(
      (node) => {
        const id =
          node.getAttribute(
            "Id"
          );

        const target =
          node.getAttribute(
            "Target"
          );

        if (
          id &&
          target
        ) {
          const normalized =
            target.startsWith(
              "../"
            )
              ? `ppt/${target.slice(
                  3
                )}`
              : `ppt/slides/${target}`;

          result.set(
            id,
            normalized.replace(
              /\\/g,
              "/"
            )
          );
        }
      }
    );

  return result;
}

function readTextStyle(
  shape: Element
) {
  const runProperties =
    Array.from(
      shape.getElementsByTagName(
        "*"
      )
    ).find(
      (node) =>
        node.localName ===
          "rPr" ||
        node.localName ===
          "defRPr"
    ) ?? null;

  const sizeRaw =
    attrNumber(
      runProperties,
      "sz",
      2400
    );

  const fontSize =
    Math.max(
      12,
      Math.min(
        54,
        sizeRaw / 100
      )
    );

  const colorNode =
    runProperties
      ? Array.from(
          runProperties.getElementsByTagName(
            "*"
          )
        ).find(
          (node) =>
            node.localName ===
            "srgbClr"
        )
      : null;

  const color =
    colorNode?.getAttribute(
      "val"
    )
      ? `#${colorNode.getAttribute(
          "val"
        )}`
      : "#111827";

  const bold =
    runProperties
      ?.getAttribute(
        "b"
      ) === "1";

  return {
    fontSize,
    color,
    bold,
  };
}

function getShapeTransform(
  shape: Element
) {
  const xfrm =
    firstDescendant(
      shape,
      "xfrm"
    );

  const off =
    xfrm
      ? getDirectChildrenByLocalName(
          xfrm,
          "off"
        )[0] ??
        firstDescendant(
          xfrm,
          "off"
        )
      : null;

  const ext =
    xfrm
      ? getDirectChildrenByLocalName(
          xfrm,
          "ext"
        )[0] ??
        firstDescendant(
          xfrm,
          "ext"
        )
      : null;

  return {
    x:
      attrNumber(
        off,
        "x"
      ),
    y:
      attrNumber(
        off,
        "y"
      ),
    cx:
      attrNumber(
        ext,
        "cx"
      ),
    cy:
      attrNumber(
        ext,
        "cy"
      ),
  };
}

async function renderSlideToSvg(
  zip: JSZip,
  slideNumber: number,
  slideCx: number,
  slideCy: number
) {
  const slideFile =
    zip.file(
      `ppt/slides/slide${slideNumber}.xml`
    );

  if (!slideFile) {
    throw new Error(
      `Không đọc được slide ${slideNumber}.`
    );
  }

  const xml =
    await slideFile.async(
      "string"
    );

  const documentXml =
    new DOMParser().parseFromString(
      xml,
      "application/xml"
    );

  const relationships =
    await getRelationships(
      zip,
      slideNumber
    );

  const width =
    1280;

  const height =
    Math.max(
      1,
      Math.round(
        width *
        slideCy /
        slideCx
      )
    );

  const scaleX =
    width /
    slideCx;

  const scaleY =
    height /
    slideCy;

  const pieces:
    string[] = [
      `<rect width="100%" height="100%" fill="#ffffff"/>`,
  ];

  const shapes =
    Array.from(
      documentXml.getElementsByTagName(
        "*"
      )
    ).filter(
      (node) =>
        node.localName ===
          "sp"
    );

  for (
    const shape of
    shapes
  ) {
    const transform =
      getShapeTransform(
        shape
      );

    const texts =
      Array.from(
        shape.getElementsByTagName(
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
            )
        )
        .filter(
          (value) =>
            value.trim()
              .length >
            0
        );

    if (
      texts.length ===
        0 ||
      transform.cx <=
        0 ||
      transform.cy <=
        0
    ) {
      continue;
    }

    const style =
      readTextStyle(
        shape
      );

    const x =
      transform.x *
      scaleX;

    const y =
      transform.y *
      scaleY;

    const boxWidth =
      transform.cx *
      scaleX;

    const boxHeight =
      transform.cy *
      scaleY;

    const lineHeight =
      style.fontSize *
      1.2;

    const maxChars =
      Math.max(
        8,
        Math.floor(
          boxWidth /
          Math.max(
            7,
            style.fontSize *
            0.55
          )
        )
      );

    const words =
      texts
        .join(" ")
        .split(
          /\s+/
        )
        .filter(Boolean);

    const lines:
      string[] =
      [];

    let current =
      "";

    for (
      const word of
      words
    ) {
      const next =
        current
          ? `${current} ${word}`
          : word;

      if (
        next.length >
          maxChars &&
        current
      ) {
        lines.push(
          current
        );

        current =
          word;
      } else {
        current =
          next;
      }
    }

    if (
      current
    ) {
      lines.push(
        current
      );
    }

    const maxLines =
      Math.max(
        1,
        Math.floor(
          boxHeight /
          lineHeight
        )
      );

    const visibleLines =
      lines.slice(
        0,
        maxLines
      );

    visibleLines.forEach(
      (
        line,
        lineIndex
      ) => {
        const textY =
          y +
          style.fontSize +
          lineIndex *
          lineHeight;

        pieces.push(
          `<text x="${x.toFixed(
            2
          )}" y="${textY.toFixed(
            2
          )}" font-family="Arial, Helvetica, sans-serif" font-size="${style.fontSize.toFixed(
            1
          )}" font-weight="${style.bold ? "700" : "400"}" fill="${escapeXml(
            style.color
          )}">${escapeXml(
            line
          )}</text>`
        );
      }
    );
  }

  const pictures =
    Array.from(
      documentXml.getElementsByTagName(
        "*"
      )
    ).filter(
      (node) =>
        node.localName ===
          "pic"
    );

  for (
    const picture of
    pictures
  ) {
    const transform =
      getShapeTransform(
        picture
      );

    if (
      transform.cx <=
        0 ||
      transform.cy <=
        0
    ) {
      continue;
    }

    const blip =
      Array.from(
        picture.getElementsByTagName(
          "*"
        )
      ).find(
        (node) =>
          node.localName ===
          "blip"
      );

    if (!blip) {
      continue;
    }

    const relId =
      blip.getAttribute(
        "r:embed"
      ) ??
      blip.getAttribute(
        "embed"
      );

    if (!relId) {
      continue;
    }

    const mediaPath =
      relationships.get(
        relId
      );

    if (!mediaPath) {
      continue;
    }

    const mediaFile =
      zip.file(
        mediaPath
      );

    if (!mediaFile) {
      continue;
    }

    try {
      const bytes =
        await mediaFile.async(
          "uint8array"
        );

      /*
       * JSZip trả về Uint8Array<ArrayBufferLike>.
       * TypeScript DOM BlobPart yêu cầu ArrayBuffer chuẩn.
       * Copy dữ liệu sang buffer mới để tránh SharedArrayBuffer type mismatch.
       */
      const imageBytes =
        new Uint8Array(
          bytes.byteLength
        );

      imageBytes.set(
        bytes
      );

      const blob =
        new Blob(
          [
            imageBytes.buffer,
          ],
          {
            type:
              mimeFromPath(
                mediaPath
              ),
          }
        );

      const dataUrl =
        await blobToDataUrl(
          blob
        );

      pieces.push(
        `<image href="${escapeXml(
          dataUrl
        )}" x="${(
          transform.x *
          scaleX
        ).toFixed(
          2
        )}" y="${(
          transform.y *
          scaleY
        ).toFixed(
          2
        )}" width="${(
          transform.cx *
          scaleX
        ).toFixed(
          2
        )}" height="${(
          transform.cy *
          scaleY
        ).toFixed(
          2
        )}" preserveAspectRatio="xMidYMid meet"/>`
      );
    } catch (
      error
    ) {
      console.warn(
        `Không đọc được ảnh của slide ${slideNumber}:`,
        error
      );
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${pieces.join(
      ""
    )}</svg>`;

  return new Blob(
    [svg],
    {
      type:
        "image/svg+xml",
    }
  );
}

async function getSlideTitles(
  zip: JSZip,
  slideCount: number
) {
  const titles:
    string[] =
      [];

  for (
    let index = 0;
    index <
    slideCount;
    index++
  ) {
    const slideFile =
      zip.file(
        `ppt/slides/slide${index + 1}.xml`
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

  const zip =
    await JSZip.loadAsync(
      file
    );

  const slideFiles =
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

  const slideCount =
    slideFiles.length;

  if (
    slideCount <
      1
  ) {
    throw new Error(
      "Không tìm thấy slide trong file PPTX."
    );
  }

  const {
    cx:
      slideCx,
    cy:
      slideCy,
  } =
    await getSlideSize(
      zip
    );

  const titles =
    await getSlideTitles(
      zip,
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
    const blob =
      await renderSlideToSvg(
        zip,
        index + 1,
        slideCx,
        slideCy
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

  return project;
}
