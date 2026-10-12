import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

import {
  promisify,
} from "node:util";

import {
  cookies,
} from "next/headers";

import {
  NextRequest,
} from "next/server";

import {
  db,
} from "@/lib/db";

import {
  isAccessRole,
} from "@/lib/permissions";

import type {
  AccessRole,
} from "@/lib/permissions";

const scrypt =
  promisify(
    scryptCallback
  );

export const SESSION_COOKIE =
  "vlearning_session";

const REMEMBER_DAYS =
  30;

const TEMP_SESSION_HOURS =
  12;

const MAX_LOGIN_FAILURES =
  5;

const LOCK_MINUTES =
  15;

export type ServerUser = {
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

export class AuthError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400
  ) {
    super(
      message
    );
    this.name =
      "AuthError";
    this.status =
      status;
  }
}

function normalizeEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function validateEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

export function validatePassword(
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

function publicUser(
  user: {
    id: string;
    displayName: string;
    email: string;
    role: string;
    organization: string;
    accessRole: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt:
      | Date
      | null;
  }
): ServerUser {
  return {
    id:
      user.id,
    displayName:
      user.displayName,
    email:
      user.email,
    role:
      user.role,
    organization:
      user.organization,
    accessRole:
      isAccessRole(
        user.accessRole
      )
        ? user.accessRole
        : "LEARNER",
    isActive:
      user.isActive,
    createdAt:
      user.createdAt.toISOString(),
    updatedAt:
      user.updatedAt.toISOString(),
    lastLoginAt:
      (
        user.lastLoginAt ??
        user.createdAt
      ).toISOString(),
  };
}

function sha256(
  value: string
) {
  return createHash(
    "sha256"
  )
    .update(
      value
    )
    .digest(
      "hex"
    );
}

async function hashPassword(
  password: string,
  saltHex: string
) {
  const result =
    (await scrypt(
      password,
      Buffer.from(
        saltHex,
        "hex"
      ),
      64
    )) as Buffer;

  return result.toString(
    "hex"
  );
}

async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHash: string
) {
  const actual =
    Buffer.from(
      await hashPassword(
        password,
        saltHex
      ),
      "hex"
    );

  const expected =
    Buffer.from(
      expectedHash,
      "hex"
    );

  if (
    actual.length !==
    expected.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actual,
    expected
  );
}

function sessionExpiry(
  remember: boolean
) {
  return new Date(
    Date.now() +
      (
        remember
          ? REMEMBER_DAYS *
            24 *
            60 *
            60 *
            1000
          : TEMP_SESSION_HOURS *
            60 *
            60 *
            1000
      )
  );
}

async function setSessionCookie(
  token: string,
  expiresAt: Date,
  remember: boolean
) {
  const store =
    await cookies();

  store.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly:
        true,
      sameSite:
        "lax",
      secure:
        process.env.VLEARNING_COOKIE_SECURE ===
        "1",
      path:
        "/",
      ...(remember
        ? {
            expires:
              expiresAt,
          }
        : {}),
    }
  );
}

export async function clearSessionCookie() {
  const store =
    await cookies();

  store.set(
    SESSION_COOKIE,
    "",
    {
      httpOnly:
        true,
      sameSite:
        "lax",
      secure:
        process.env.VLEARNING_COOKIE_SECURE ===
        "1",
      path:
        "/",
      expires:
        new Date(0),
    }
  );
}

async function createSession(
  userId: string,
  remember: boolean
) {
  const token =
    randomBytes(
      32
    ).toString(
      "base64url"
    );

  const expiresAt =
    sessionExpiry(
      remember
    );

  await db.session.create(
    {
      data: {
        userId,
        tokenHash:
          sha256(
            token
          ),
        expiresAt,
      },
    }
  );

  await setSessionCookie(
    token,
    expiresAt,
    remember
  );
}

async function sessionToken() {
  const store =
    await cookies();

  return (
    store.get(
      SESSION_COOKIE
    )?.value ??
    ""
  );
}

export async function requireSameOrigin(
  request: NextRequest
) {
  const origin =
    request.headers.get(
      "origin"
    );

  if (
    !origin
  ) {
    return;
  }

  const host =
    request.headers.get(
      "host"
    );

  if (
    !host
  ) {
    return;
  }

  let originHost =
    "";

  try {
    originHost =
      new URL(
        origin
      ).host;
  } catch {
    throw new AuthError(
      "Yêu cầu không hợp lệ.",
      403
    );
  }

  if (
    originHost !==
    host
  ) {
    throw new AuthError(
      "Yêu cầu khác nguồn bị từ chối.",
      403
    );
  }
}

export async function registerServerUser(
  input: {
    displayName: string;
    email: string;
    role: string;
    organization: string;
    password: string;
    remember: boolean;
  }
) {
  const displayName =
    input.displayName.trim();

  const email =
    normalizeEmail(
      input.email
    );

  if (
    displayName.length <
    2
  ) {
    throw new AuthError(
      "Tên hiển thị cần ít nhất 2 ký tự."
    );
  }

  if (
    !validateEmail(
      email
    )
  ) {
    throw new AuthError(
      "Email chưa đúng định dạng."
    );
  }

  const problems =
    validatePassword(
      input.password
    );

  if (
    problems.length >
    0
  ) {
    throw new AuthError(
      `Mật khẩu cần ${problems.join(
        ", "
      )}.`
    );
  }

  const existing =
    await db.user.findUnique(
      {
        where: {
          email,
        },
        select: {
          id:
            true,
        },
      }
    );

  if (
    existing
  ) {
    throw new AuthError(
      "Email này đã được sử dụng.",
      409
    );
  }

  const salt =
    randomBytes(
      16
    ).toString(
      "hex"
    );

  const passwordHash =
    await hashPassword(
      input.password,
      salt
    );

  const now =
    new Date();

  const userCount =
    await db.user.count();

  const accessRole:
    AccessRole =
      userCount ===
      0
        ? "ADMIN"
        : "LEARNER";

  const user =
    await db.user.create(
      {
        data: {
          email,
          displayName,
          role:
            input.role.trim() ||
            "Giáo viên",
          organization:
            input.organization.trim(),
          accessRole,
          isActive:
            true,
          passwordHash,
          passwordSalt:
            salt,
          lastLoginAt:
            now,
        },
      }
    );

  await createSession(
    user.id,
    input.remember
  );

  return publicUser(
    user
  );
}

export async function loginServerUser(
  input: {
    email: string;
    password: string;
    remember: boolean;
  }
) {
  const email =
    normalizeEmail(
      input.email
    );

  const user =
    await db.user.findUnique(
      {
        where: {
          email,
        },
      }
    );

  if (
    !user
  ) {
    throw new AuthError(
      "Email hoặc mật khẩu không đúng.",
      401
    );
  }

  if (
    !user.isActive
  ) {
    throw new AuthError(
      "Tài khoản đã bị quản trị viên vô hiệu hóa.",
      403
    );
  }

  if (
    user.lockedUntil &&
    user.lockedUntil.getTime() >
      Date.now()
  ) {
    throw new AuthError(
      `Đăng nhập đang tạm khóa. Hãy thử lại sau ${user.lockedUntil.toLocaleTimeString(
        "vi-VN",
        {
          hour:
            "2-digit",
          minute:
            "2-digit",
        }
      )}.`,
      429
    );
  }

  const valid =
    await verifyPassword(
      input.password,
      user.passwordSalt,
      user.passwordHash
    );

  if (
    !valid
  ) {
    const nextFailures =
      user.failedLoginCount +
      1;

    const lock =
      nextFailures >=
      MAX_LOGIN_FAILURES
        ? new Date(
            Date.now() +
              LOCK_MINUTES *
                60 *
                1000
          )
        : null;

    await db.user.update(
      {
        where: {
          id:
            user.id,
        },
        data: {
          failedLoginCount:
            lock
              ? 0
              : nextFailures,
          lockedUntil:
            lock,
        },
      }
    );

    throw new AuthError(
      lock
        ? `Đăng nhập sai quá nhiều lần. Tài khoản tạm khóa ${LOCK_MINUTES} phút.`
        : "Email hoặc mật khẩu không đúng.",
      lock
        ? 429
        : 401
    );
  }

  const updated =
    await db.user.update(
      {
        where: {
          id:
            user.id,
        },
        data: {
          failedLoginCount:
            0,
          lockedUntil:
            null,
          lastLoginAt:
            new Date(),
        },
      }
    );

  await createSession(
    updated.id,
    input.remember
  );

  return publicUser(
    updated
  );
}

export async function serverUserForGuard():
  Promise<
    ServerUser | null
  > {
  const token =
    await sessionToken();

  if (
    !token
  ) {
    return null;
  }

  const session =
    await db.session.findUnique(
      {
        where: {
          tokenHash:
            sha256(
              token
            ),
        },
        include: {
          user:
            true,
        },
      }
    );

  if (
    !session ||
    !session.user.isActive ||
    session.expiresAt.getTime() <=
      Date.now()
  ) {
    return null;
  }

  return publicUser(
    session.user
  );
}

export async function currentServerUser():
  Promise<
    ServerUser | null
  > {
  const token =
    await sessionToken();

  if (
    !token
  ) {
    return null;
  }

  const session =
    await db.session.findUnique(
      {
        where: {
          tokenHash:
            sha256(
              token
            ),
        },
        include: {
          user:
            true,
        },
      }
    );

  if (
    !session
  ) {
    await clearSessionCookie();
    return null;
  }

  if (
    !session.user.isActive
  ) {
    await db.session.deleteMany(
      {
        where: {
          userId:
            session.user.id,
        },
      }
    );

    await clearSessionCookie();

    return null;
  }

  if (
    session.expiresAt.getTime() <=
    Date.now()
  ) {
    await db.session.delete(
      {
        where: {
          id:
            session.id,
        },
      }
    );

    await clearSessionCookie();

    return null;
  }

  return publicUser(
    session.user
  );
}

async function requireUserRecord() {
  const token =
    await sessionToken();

  if (
    !token
  ) {
    throw new AuthError(
      "Chưa đăng nhập.",
      401
    );
  }

  const session =
    await db.session.findUnique(
      {
        where: {
          tokenHash:
            sha256(
              token
            ),
        },
        include: {
          user:
            true,
        },
      }
    );

  if (
    session &&
    !session.user.isActive
  ) {
    await db.session.deleteMany(
      {
        where: {
          userId:
            session.user.id,
        },
      }
    );

    await clearSessionCookie();

    throw new AuthError(
      "Tài khoản đã bị vô hiệu hóa.",
      403
    );
  }

  if (
    !session ||
    session.expiresAt.getTime() <=
      Date.now()
  ) {
    await clearSessionCookie();

    throw new AuthError(
      "Phiên đăng nhập đã hết hạn.",
      401
    );
  }

  return {
    session,
    user:
      session.user,
  };
}

export async function logoutServerUser() {
  const token =
    await sessionToken();

  if (
    token
  ) {
    await db.session.deleteMany(
      {
        where: {
          tokenHash:
            sha256(
              token
            ),
        },
      }
    );
  }

  await clearSessionCookie();
}

export async function updateServerProfile(
  input: {
    displayName: string;
    role: string;
    organization: string;
  }
) {
  const {
    user,
  } =
    await requireUserRecord();

  const displayName =
    input.displayName.trim();

  if (
    displayName.length <
    2
  ) {
    throw new AuthError(
      "Tên hiển thị cần ít nhất 2 ký tự."
    );
  }

  const updated =
    await db.user.update(
      {
        where: {
          id:
            user.id,
        },
        data: {
          displayName,
          role:
            input.role.trim() ||
            "Giáo viên",
          organization:
            input.organization.trim(),
        },
      }
    );

  return publicUser(
    updated
  );
}

export async function changeServerPassword(
  input: {
    oldPassword: string;
    newPassword: string;
  }
) {
  const {
    session,
    user,
  } =
    await requireUserRecord();

  const oldValid =
    await verifyPassword(
      input.oldPassword,
      user.passwordSalt,
      user.passwordHash
    );

  if (
    !oldValid
  ) {
    throw new AuthError(
      "Mật khẩu hiện tại không đúng.",
      401
    );
  }

  const problems =
    validatePassword(
      input.newPassword
    );

  if (
    problems.length >
    0
  ) {
    throw new AuthError(
      `Mật khẩu mới cần ${problems.join(
        ", "
      )}.`
    );
  }

  const salt =
    randomBytes(
      16
    ).toString(
      "hex"
    );

  const passwordHash =
    await hashPassword(
      input.newPassword,
      salt
    );

  await db.$transaction([
    db.user.update(
      {
        where: {
          id:
            user.id,
        },
        data: {
          passwordSalt:
            salt,
          passwordHash,
        },
      }
    ),

    db.session.deleteMany(
      {
        where: {
          userId:
            user.id,
          id: {
            not:
              session.id,
          },
        },
      }
    ),
  ]);
}

export async function deleteServerAccount(
  password: string
) {
  const {
    user,
  } =
    await requireUserRecord();

  const valid =
    await verifyPassword(
      password,
      user.passwordSalt,
      user.passwordHash
    );

  if (
    !valid
  ) {
    throw new AuthError(
      "Mật khẩu xác nhận không đúng.",
      401
    );
  }

  if (
    user.accessRole ===
    "ADMIN"
  ) {
    const activeAdmins =
      await db.user.count(
        {
          where: {
            accessRole:
              "ADMIN",
            isActive:
              true,
          },
        }
      );

    if (
      user.isActive &&
      activeAdmins <=
        1
    ) {
      throw new AuthError(
        "Không thể xóa quản trị viên hoạt động cuối cùng. Hãy cấp quyền ADMIN cho tài khoản khác trước."
      );
    }
  }

  await db.user.delete(
    {
      where: {
        id:
          user.id,
      },
    }
  );

  await clearSessionCookie();
}


export async function requireAdminUser() {
  const {
    session,
    user,
  } =
    await requireUserRecord();

  if (
    user.accessRole !==
    "ADMIN"
  ) {
    throw new AuthError(
      "Bạn không có quyền quản trị người dùng.",
      403
    );
  }

  return {
    session,
    user,
  };
}

export async function listAdminUsers() {
  await requireAdminUser();

  const users =
    await db.user.findMany(
      {
        orderBy: [
          {
            createdAt:
              "asc",
          },
        ],
      }
    );

  return users.map(
    publicUser
  );
}

export async function updateAdminUserAccess(
  targetUserId: string,
  input: {
    accessRole: string;
    isActive: boolean;
  }
) {
  const {
    user:
      admin,
  } =
    await requireAdminUser();

  const target =
    await db.user.findUnique(
      {
        where: {
          id:
            targetUserId,
        },
      }
    );

  if (
    !target
  ) {
    throw new AuthError(
      "Không tìm thấy tài khoản.",
      404
    );
  }

  if (
    !isAccessRole(
      input.accessRole
    )
  ) {
    throw new AuthError(
      "Vai trò hệ thống không hợp lệ."
    );
  }

  if (
    target.id ===
      admin.id &&
    (
      input.accessRole !==
        "ADMIN" ||
      !input.isActive
    )
  ) {
    throw new AuthError(
      "Không thể hạ quyền hoặc vô hiệu hóa chính tài khoản quản trị đang đăng nhập."
    );
  }

  if (
    target.accessRole ===
      "ADMIN" &&
    (
      input.accessRole !==
        "ADMIN" ||
      !input.isActive
    )
  ) {
    const activeAdmins =
      await db.user.count(
        {
          where: {
            accessRole:
              "ADMIN",
            isActive:
              true,
          },
        }
      );

    if (
      target.isActive &&
      activeAdmins <=
        1
    ) {
      throw new AuthError(
        "Hệ thống phải còn ít nhất một quản trị viên đang hoạt động."
      );
    }
  }

  const updated =
    await db.user.update(
      {
        where: {
          id:
            target.id,
        },
        data: {
          accessRole:
            input.accessRole,
          isActive:
            input.isActive,
        },
      }
    );

  if (
    updated.id !==
    admin.id
  ) {
    await db.session.deleteMany(
      {
        where: {
          userId:
            updated.id,
        },
      }
    );
  }

  return publicUser(
    updated
  );
}

export async function deleteAdminUser(
  targetUserId: string
) {
  const {
    user:
      admin,
  } =
    await requireAdminUser();

  if (
    targetUserId ===
    admin.id
  ) {
    throw new AuthError(
      "Không thể xóa chính tài khoản quản trị đang đăng nhập."
    );
  }

  const target =
    await db.user.findUnique(
      {
        where: {
          id:
            targetUserId,
        },
      }
    );

  if (
    !target
  ) {
    throw new AuthError(
      "Không tìm thấy tài khoản.",
      404
    );
  }

  if (
    target.accessRole ===
      "ADMIN" &&
    target.isActive
  ) {
    const activeAdmins =
      await db.user.count(
        {
          where: {
            accessRole:
              "ADMIN",
            isActive:
              true,
          },
        }
      );

    if (
      activeAdmins <=
      1
    ) {
      throw new AuthError(
        "Không thể xóa quản trị viên hoạt động cuối cùng."
      );
    }
  }

  await db.user.delete(
    {
      where: {
        id:
          target.id,
      },
    }
  );
}

export async function cleanupExpiredSessions() {
  await db.session.deleteMany(
    {
      where: {
        expiresAt: {
          lte:
            new Date(),
        },
      },
    }
  );
}
