"use client";

export type CloudStatus = {
  configured: boolean;
  online: boolean;
  projectCount: number;
  ownerUserId: string;
};

export type CloudProjectMeta = {
  projectId: string;
  title: string;
  clientUpdatedAt:
    | string
    | null;
  serverUpdatedAt: string;
  version: number;
};

export type CloudProjectRecord =
  CloudProjectMeta & {
    snapshot: unknown;
  };

type CloudApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function cloudApi<T>(
  path: string,
  init?: RequestInit
) {
  const response =
    await fetch(
      path,
      {
        ...init,
        credentials:
          "same-origin",
        cache:
          "no-store",
        headers: {
          "Content-Type":
            "application/json",
          ...(init?.headers ??
            {}),
        },
      }
    );

  let payload:
    CloudApiResponse<T>;

  try {
    payload =
      await response.json();
  } catch {
    payload =
      {
        ok:
          false,
        error:
          "Phản hồi Cloud không hợp lệ.",
      };
  }

  if (
    !response.ok ||
    !payload.ok
  ) {
    throw new Error(
      payload.error ??
      "Yêu cầu Cloud thất bại."
    );
  }

  if (
    payload.data ===
    undefined
  ) {
    throw new Error(
      "Cloud không trả về dữ liệu."
    );
  }

  return payload.data;
}

export function getCloudStatusClient() {
  return cloudApi<CloudStatus>(
    "/api/cloud/status",
    {
      method:
        "GET",
    }
  );
}

export function listCloudProjectsClient() {
  return cloudApi<CloudProjectMeta[]>(
    "/api/cloud/projects",
    {
      method:
        "GET",
    }
  );
}

export function getCloudProjectClient(
  projectId: string
) {
  return cloudApi<CloudProjectRecord>(
    `/api/cloud/projects/${encodeURIComponent(
      projectId
    )}`,
    {
      method:
        "GET",
    }
  );
}

export function pushCloudProjectsClient(
  projects: Array<{
    projectId: string;
    title: string;
    clientUpdatedAt: string;
    snapshot: unknown;
  }>
) {
  return cloudApi<{
    synced:
      number;
    projects:
      CloudProjectMeta[];
  }>(
    "/api/cloud/projects/sync",
    {
      method:
        "POST",
      body:
        JSON.stringify(
          {
            projects,
          }
        ),
    }
  );
}

export function deleteCloudProjectClient(
  projectId: string
) {
  return cloudApi<{
    deleted:
      true;
  }>(
    `/api/cloud/projects/${encodeURIComponent(
      projectId
    )}`,
    {
      method:
        "DELETE",
      body:
        "{}",
    }
  );
}
