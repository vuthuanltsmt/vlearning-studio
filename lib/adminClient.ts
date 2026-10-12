"use client";

import type {
  AccessRole,
} from "@/lib/permissions";

export type AdminUserRow = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organization: string;
  accessRole: AccessRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

type AdminApiResponse<T> = {
  ok: boolean;
  users?: T;
  user?: AdminUserRow;
  error?: string;
};

async function adminApi<T>(
  path: string,
  init?: RequestInit
) {
  const response =
    await fetch(
      path,
      {
        ...init,
        headers: {
          "Content-Type":
            "application/json",
          ...(init?.headers ??
            {}),
        },
        credentials:
          "same-origin",
        cache:
          "no-store",
      }
    );

  let payload:
    AdminApiResponse<T>;

  try {
    payload =
      await response.json();
  } catch {
    payload =
      {
        ok:
          false,
        error:
          "Phản hồi quản trị không hợp lệ.",
      };
  }

  if (
    !response.ok ||
    !payload.ok
  ) {
    throw new Error(
      payload.error ??
      "Yêu cầu quản trị thất bại."
    );
  }

  return payload;
}

export async function fetchAdminUsers() {
  const payload =
    await adminApi<
      AdminUserRow[]
    >(
      "/api/admin/users",
      {
        method:
          "GET",
      }
    );

  return (
    payload.users ??
    []
  );
}

export async function updateAdminUser(
  userId: string,
  input: {
    accessRole: AccessRole;
    isActive: boolean;
  }
) {
  const payload =
    await adminApi<never>(
      `/api/admin/users/${encodeURIComponent(
        userId
      )}`,
      {
        method:
          "PATCH",
        body:
          JSON.stringify(
            input
          ),
      }
    );

  if (
    !payload.user
  ) {
    throw new Error(
      "Máy chủ không trả về người dùng đã cập nhật."
    );
  }

  return payload.user;
}

export async function deleteAdminUser(
  userId: string
) {
  await adminApi<never>(
    `/api/admin/users/${encodeURIComponent(
      userId
    )}`,
    {
      method:
        "DELETE",
        body:
          "{}",
    }
  );
}
