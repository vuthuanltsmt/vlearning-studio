"use client";

import type {
  AccessRole,
} from "@/lib/permissions";

export const SERVER_AUTH_EVENT =
  "vlearning-server-auth-changed";

export type ServerSessionUser = {
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

type ApiResponse<T> = {
  ok: boolean;
  user?: T;
  error?: string;
};

function emitAuthChanged() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      SERVER_AUTH_EVENT
    )
  );
}

async function api<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
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
    ApiResponse<T>;

  try {
    payload =
      await response.json();
  } catch {
    payload =
      {
        ok:
          false,
        error:
          "Phản hồi từ máy chủ không hợp lệ.",
      };
  }

  if (
    !response.ok ||
    !payload.ok
  ) {
    throw new Error(
      payload.error ??
      "Yêu cầu thất bại."
    );
  }

  return payload;
}

export function validateServerPassword(
  password: string
) {
  const problems:
    string[] =
      [];

  if (
    password.length <
    8
  ) {
    problems.push(
      "ít nhất 8 ký tự"
    );
  }

  if (
    !/[A-Za-zÀ-ỹ]/.test(
      password
    )
  ) {
    problems.push(
      "ít nhất 1 chữ cái"
    );
  }

  if (
    !/\d/.test(
      password
    )
  ) {
    problems.push(
      "ít nhất 1 chữ số"
    );
  }

  return problems;
}

export async function getServerSession() {
  try {
    const payload =
      await api<ServerSessionUser>(
        "/api/auth/me",
        {
          method:
            "GET",
        }
      );

    return (
      payload.user ??
      null
    );
  } catch {
    return null;
  }
}

export async function registerServerAccount(
  input: {
    displayName: string;
    email: string;
    role: string;
    organization: string;
    password: string;
    remember: boolean;
  }
) {
  const payload =
    await api<ServerSessionUser>(
      "/api/auth/register",
      {
        method:
          "POST",
        body:
          JSON.stringify(
            input
          ),
      }
    );

  emitAuthChanged();

  if (
    !payload.user
  ) {
    throw new Error(
      "Máy chủ không trả về tài khoản."
    );
  }

  return payload.user;
}

export async function loginServerAccount(
  input: {
    email: string;
    password: string;
    remember: boolean;
  }
) {
  const payload =
    await api<ServerSessionUser>(
      "/api/auth/login",
      {
        method:
          "POST",
        body:
          JSON.stringify(
            input
          ),
      }
    );

  emitAuthChanged();

  if (
    !payload.user
  ) {
    throw new Error(
      "Máy chủ không trả về tài khoản."
    );
  }

  return payload.user;
}

export async function logoutServerAccount() {
  await api<never>(
    "/api/auth/logout",
    {
      method:
        "POST",
      body:
        "{}",
    }
  );

  emitAuthChanged();
}

export async function updateServerAccountProfile(
  input: {
    displayName: string;
    role: string;
    organization: string;
  }
) {
  const payload =
    await api<ServerSessionUser>(
      "/api/auth/profile",
      {
        method:
          "PATCH",
        body:
          JSON.stringify(
            input
          ),
      }
    );

  emitAuthChanged();

  if (
    !payload.user
  ) {
    throw new Error(
      "Máy chủ không trả về hồ sơ."
    );
  }

  return payload.user;
}

export async function changeServerAccountPassword(
  oldPassword: string,
  newPassword: string
) {
  await api<never>(
    "/api/auth/change-password",
    {
      method:
        "POST",
      body:
        JSON.stringify(
          {
            oldPassword,
            newPassword,
          }
        ),
    }
  );

  emitAuthChanged();
}

export async function deleteServerAccount(
  password: string
) {
  await api<never>(
    "/api/auth/account",
    {
      method:
        "DELETE",
      body:
        JSON.stringify(
          {
            password,
          }
        ),
    }
  );

  emitAuthChanged();
}
