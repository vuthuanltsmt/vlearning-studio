import {
  cloudDatabaseConfigured,
  cloudDb,
} from "@/lib/cloudDb";

import {
  AuthError,
  serverUserForGuard,
} from "@/lib/authServer";

import {
  canAuthor,
} from "@/lib/permissions";

const MAX_PROJECTS_PER_PUSH =
  200;

const MAX_SNAPSHOT_BYTES =
  5 * 1024 * 1024;

export type CloudProjectSyncItem = {
  projectId: string;
  title: string;
  clientUpdatedAt?: string;
  snapshot: unknown;
};

export type CloudProjectMeta = {
  projectId: string;
  title: string;
  clientUpdatedAt: string | null;
  serverUpdatedAt: string;
  version: number;
};

async function requireCloudAuthor() {
  const user =
    await serverUserForGuard();

  if (
    !user
  ) {
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
      "Tài khoản không có quyền đồng bộ Project.",
      403
    );
  }

  return user;
}

function requireCloudConfigured() {
  if (
    !cloudDatabaseConfigured()
  ) {
    throw new AuthError(
      "Cloud PostgreSQL chưa được cấu hình. Hãy chạy SETUP-A17-CLOUD.cmd.",
      503
    );
  }
}

function cleanTitle(
  value: unknown
) {
  const title =
    String(
      value ??
      ""
    ).trim();

  return (
    title ||
    "Bài giảng"
  ).slice(
    0,
    240
  );
}

function parseClientDate(
  value: unknown
) {
  if (
    typeof value !==
    "string" ||
    !value
  ) {
    return null;
  }

  const date =
    new Date(
      value
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function metaFromRow(
  row: {
    projectId: string;
    title: string;
    clientUpdatedAt:
      | Date
      | null;
    updatedAt: Date;
    version: number;
  }
): CloudProjectMeta {
  return {
    projectId:
      row.projectId,
    title:
      row.title,
    clientUpdatedAt:
      row.clientUpdatedAt?.toISOString() ??
      null,
    serverUpdatedAt:
      row.updatedAt.toISOString(),
    version:
      row.version,
  };
}

export async function getCloudStatus() {
  const user =
    await requireCloudAuthor();

  if (
    !cloudDatabaseConfigured()
  ) {
    return {
      configured:
        false,
      online:
        false,
      projectCount:
        0,
      ownerUserId:
        user.id,
    };
  }

  try {
    await cloudDb.$queryRawUnsafe(
      "SELECT 1"
    );

    const projectCount =
      await cloudDb.cloudProject.count(
        {
          where: {
            ownerUserId:
              user.id,
          },
        }
      );

    return {
      configured:
        true,
      online:
        true,
      projectCount,
      ownerUserId:
        user.id,
    };
  } catch (
    error
  ) {
    console.error(
      "A17 cloud status error:",
      error
    );

    return {
      configured:
        true,
      online:
        false,
      projectCount:
        0,
      ownerUserId:
        user.id,
    };
  }
}

export async function listCloudProjects() {
  requireCloudConfigured();

  const user =
    await requireCloudAuthor();

  const rows =
    await cloudDb.cloudProject.findMany(
      {
        where: {
          ownerUserId:
            user.id,
        },
        select: {
          projectId:
            true,
          title:
            true,
          clientUpdatedAt:
            true,
          updatedAt:
            true,
          version:
            true,
        },
        orderBy: {
          updatedAt:
            "desc",
        },
      }
    );

  return rows.map(
    metaFromRow
  );
}

export async function getCloudProject(
  projectId: string
) {
  requireCloudConfigured();

  const user =
    await requireCloudAuthor();

  const cleanProjectId =
    String(
      projectId ??
      ""
    ).trim();

  if (
    !cleanProjectId
  ) {
    throw new AuthError(
      "Project ID không hợp lệ."
    );
  }

  const row =
    await cloudDb.cloudProject.findUnique(
      {
        where: {
          ownerUserId_projectId: {
            ownerUserId:
              user.id,
            projectId:
              cleanProjectId,
          },
        },
      }
    );

  if (
    !row
  ) {
    throw new AuthError(
      "Không tìm thấy Project trên Cloud.",
      404
    );
  }

  let snapshot:
    unknown;

  try {
    snapshot =
      JSON.parse(
        row.snapshotJson
      );
  } catch {
    throw new AuthError(
      "Dữ liệu Project trên Cloud bị lỗi.",
      500
    );
  }

  return {
    ...metaFromRow(
      row
    ),
    snapshot,
  };
}

export async function syncCloudProjects(
  items: CloudProjectSyncItem[]
) {
  requireCloudConfigured();

  const user =
    await requireCloudAuthor();

  if (
    !Array.isArray(
      items
    ) ||
    items.length ===
      0
  ) {
    throw new AuthError(
      "Không có Project để đồng bộ."
    );
  }

  if (
    items.length >
    MAX_PROJECTS_PER_PUSH
  ) {
    throw new AuthError(
      `Mỗi lần chỉ đồng bộ tối đa ${MAX_PROJECTS_PER_PUSH} Project.`
    );
  }

  const results:
    CloudProjectMeta[] =
      [];

  for (
    const item of
    items
  ) {
    const projectId =
      String(
        item?.projectId ??
        ""
      ).trim();

    if (
      !projectId
    ) {
      throw new AuthError(
        "Có Project thiếu ID."
      );
    }

    let snapshotJson:
      string;

    try {
      snapshotJson =
        JSON.stringify(
          item.snapshot
        );
    } catch {
      throw new AuthError(
        `Không thể chuyển Project ${projectId} sang JSON.`
      );
    }

    const size =
      Buffer.byteLength(
        snapshotJson,
        "utf8"
      );

    if (
      size >
      MAX_SNAPSHOT_BYTES
    ) {
      throw new AuthError(
        `Project "${cleanTitle(
          item.title
        )}" vượt giới hạn snapshot 5 MB. Video/media sẽ được đưa lên Cloud ở A18.`,
        413
      );
    }

    const existing =
      await cloudDb.cloudProject.findUnique(
        {
          where: {
            ownerUserId_projectId: {
              ownerUserId:
                user.id,
              projectId,
            },
          },
        }
      );

    const data = {
      title:
        cleanTitle(
          item.title
        ),
      snapshotJson,
      clientUpdatedAt:
        parseClientDate(
          item.clientUpdatedAt
        ),
    };

    const row =
      existing
        ? await cloudDb.cloudProject.update(
            {
              where: {
                id:
                  existing.id,
              },
              data: {
                ...data,
                version: {
                  increment:
                    1,
                },
              },
            }
          )
        : await cloudDb.cloudProject.create(
            {
              data: {
                ownerUserId:
                  user.id,
                projectId,
                ...data,
              },
            }
          );

    results.push(
      metaFromRow(
        row
      )
    );
  }

  return results;
}

export async function deleteCloudProject(
  projectId: string
) {
  requireCloudConfigured();

  const user =
    await requireCloudAuthor();

  const result =
    await cloudDb.cloudProject.deleteMany(
      {
        where: {
          ownerUserId:
            user.id,
          projectId:
            String(
              projectId ??
              ""
            ).trim(),
        },
      }
    );

  if (
    result.count ===
    0
  ) {
    throw new AuthError(
      "Không tìm thấy Project trên Cloud.",
      404
    );
  }
}
