export const LOCAL_AUTH_EVENT =
  "vlearning-local-auth-changed";

const USERS_KEY =
  "vlearning-local-users-v1";

const LOCAL_SESSION_KEY =
  "vlearning-local-session-v1";

const SESSION_SESSION_KEY =
  "vlearning-local-session-temp-v1";

const PBKDF2_ITERATIONS =
  150000;

type StoredLocalUser = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  passwordSalt: string;
  passwordHash: string;
};

export type LocalSessionUser = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

export type RegisterLocalUserInput = {
  displayName: string;
  email: string;
  role: string;
  organization: string;
  password: string;
  remember: boolean;
};

export type LoginLocalUserInput = {
  email: string;
  password: string;
  remember: boolean;
};

export type UpdateLocalProfileInput = {
  displayName: string;
  role: string;
  organization: string;
};

function browserReady() {
  return (
    typeof window !==
    "undefined"
  );
}

function normalizeEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function publicUser(
  user: StoredLocalUser
): LocalSessionUser {
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
    createdAt:
      user.createdAt,
    updatedAt:
      user.updatedAt,
    lastLoginAt:
      user.lastLoginAt,
  };
}

function emitAuthChanged() {
  if (
    !browserReady()
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      LOCAL_AUTH_EVENT
    )
  );
}

function readUsers():
  StoredLocalUser[] {
  if (
    !browserReady()
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        USERS_KEY
      );

    if (
      !raw
    ) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function writeUsers(
  users: StoredLocalUser[]
) {
  if (
    !browserReady()
  ) {
    return;
  }

  window.localStorage.setItem(
    USERS_KEY,
    JSON.stringify(
      users
    )
  );
}

function sessionPayload(
  user: StoredLocalUser
) {
  return JSON.stringify(
    publicUser(
      user
    )
  );
}

function writeSession(
  user: StoredLocalUser,
  remember: boolean
) {
  if (
    !browserReady()
  ) {
    return;
  }

  const payload =
    sessionPayload(
      user
    );

  if (
    remember
  ) {
    window.localStorage.setItem(
      LOCAL_SESSION_KEY,
      payload
    );

    window.sessionStorage.removeItem(
      SESSION_SESSION_KEY
    );
  } else {
    window.sessionStorage.setItem(
      SESSION_SESSION_KEY,
      payload
    );

    window.localStorage.removeItem(
      LOCAL_SESSION_KEY
    );
  }

  emitAuthChanged();
}

function updateStoredSession(
  user: StoredLocalUser
) {
  if (
    !browserReady()
  ) {
    return;
  }

  if (
    window.localStorage.getItem(
      LOCAL_SESSION_KEY
    )
  ) {
    window.localStorage.setItem(
      LOCAL_SESSION_KEY,
      sessionPayload(
        user
      )
    );
  }

  if (
    window.sessionStorage.getItem(
      SESSION_SESSION_KEY
    )
  ) {
    window.sessionStorage.setItem(
      SESSION_SESSION_KEY,
      sessionPayload(
        user
      )
    );
  }

  emitAuthChanged();
}

function bytesToHex(
  bytes: Uint8Array
) {
  return Array.from(
    bytes
  )
    .map(
      (value) =>
        value
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");
}

function hexToBytes(
  hex: string
) {
  const result =
    new Uint8Array(
      Math.floor(
        hex.length /
          2
      )
    );

  for (
    let index = 0;
    index <
    result.length;
    index += 1
  ) {
    result[index] =
      Number.parseInt(
        hex.slice(
          index * 2,
          index * 2 +
            2
        ),
        16
      );
  }

  return result;
}

function randomHex(
  bytes = 16
) {
  if (
    !browserReady() ||
    !window.crypto
  ) {
    throw new Error(
      "Trình duyệt không hỗ trợ Web Crypto."
    );
  }

  const value =
    new Uint8Array(
      bytes
    );

  window.crypto.getRandomValues(
    value
  );

  return bytesToHex(
    value
  );
}

async function passwordHash(
  password: string,
  saltHex: string
) {
  if (
    !browserReady() ||
    !window.crypto?.subtle
  ) {
    throw new Error(
      "Trình duyệt không hỗ trợ mã hóa mật khẩu."
    );
  }

  const encoder =
    new TextEncoder();

  const key =
    await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(
        password
      ),
      "PBKDF2",
      false,
      [
        "deriveBits",
      ]
    );

  const bits =
    await window.crypto.subtle.deriveBits(
      {
        name:
          "PBKDF2",
        hash:
          "SHA-256",
        salt:
          hexToBytes(
            saltHex
          ),
        iterations:
          PBKDF2_ITERATIONS,
      },
      key,
      256
    );

  return bytesToHex(
    new Uint8Array(
      bits
    )
  );
}

export function validateLocalPassword(
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

export function getLocalSession():
  LocalSessionUser | null {
  if (
    !browserReady()
  ) {
    return null;
  }

  const raw =
    window.localStorage.getItem(
      LOCAL_SESSION_KEY
    ) ??
    window.sessionStorage.getItem(
      SESSION_SESSION_KEY
    );

  if (
    !raw
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        raw
      ) as LocalSessionUser;

    if (
      !parsed ||
      typeof parsed.id !==
        "string" ||
      typeof parsed.email !==
        "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function registerLocalUser(
  input: RegisterLocalUserInput
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
    throw new Error(
      "Tên hiển thị cần ít nhất 2 ký tự."
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    throw new Error(
      "Email chưa đúng định dạng."
    );
  }

  const passwordProblems =
    validateLocalPassword(
      input.password
    );

  if (
    passwordProblems.length >
    0
  ) {
    throw new Error(
      `Mật khẩu cần ${passwordProblems.join(
        ", "
      )}.`
    );
  }

  const users =
    readUsers();

  if (
    users.some(
      (user) =>
        user.email ===
        email
    )
  ) {
    throw new Error(
      "Email này đã có tài khoản Local."
    );
  }

  const salt =
    randomHex();

  const hash =
    await passwordHash(
      input.password,
      salt
    );

  const now =
    new Date().toISOString();

  const user:
    StoredLocalUser =
      {
        id:
          `local-user-${randomHex(
            10
          )}`,
        displayName,
        email,
        role:
          input.role.trim() ||
          "Giáo viên",
        organization:
          input.organization.trim(),
        createdAt:
          now,
        updatedAt:
          now,
        lastLoginAt:
          now,
        passwordSalt:
          salt,
        passwordHash:
          hash,
      };

  writeUsers([
    ...users,
    user,
  ]);

  writeSession(
    user,
    input.remember
  );

  return publicUser(
    user
  );
}

export async function loginLocalUser(
  input: LoginLocalUserInput
) {
  const email =
    normalizeEmail(
      input.email
    );

  const users =
    readUsers();

  const user =
    users.find(
      (item) =>
        item.email ===
        email
    );

  if (
    !user
  ) {
    throw new Error(
      "Không tìm thấy tài khoản Local với email này."
    );
  }

  const hash =
    await passwordHash(
      input.password,
      user.passwordSalt
    );

  if (
    hash !==
    user.passwordHash
  ) {
    throw new Error(
      "Mật khẩu không đúng."
    );
  }

  const nextUser:
    StoredLocalUser =
      {
        ...user,
        lastLoginAt:
          new Date().toISOString(),
      };

  writeUsers(
    users.map(
      (item) =>
        item.id ===
        user.id
          ? nextUser
          : item
    )
  );

  writeSession(
    nextUser,
    input.remember
  );

  return publicUser(
    nextUser
  );
}

export function logoutLocalUser() {
  if (
    !browserReady()
  ) {
    return;
  }

  window.localStorage.removeItem(
    LOCAL_SESSION_KEY
  );

  window.sessionStorage.removeItem(
    SESSION_SESSION_KEY
  );

  emitAuthChanged();
}

export function updateLocalProfile(
  input: UpdateLocalProfileInput
) {
  const session =
    getLocalSession();

  if (
    !session
  ) {
    throw new Error(
      "Chưa đăng nhập."
    );
  }

  const displayName =
    input.displayName.trim();

  if (
    displayName.length <
    2
  ) {
    throw new Error(
      "Tên hiển thị cần ít nhất 2 ký tự."
    );
  }

  const users =
    readUsers();

  const index =
    users.findIndex(
      (user) =>
        user.id ===
        session.id
    );

  if (
    index <
    0
  ) {
    throw new Error(
      "Không tìm thấy tài khoản."
    );
  }

  const updated:
    StoredLocalUser =
      {
        ...users[
          index
        ],
        displayName,
        role:
          input.role.trim() ||
          "Giáo viên",
        organization:
          input.organization.trim(),
        updatedAt:
          new Date().toISOString(),
      };

  const next =
    [...users];

  next[
    index
  ] =
    updated;

  writeUsers(
    next
  );

  updateStoredSession(
    updated
  );

  return publicUser(
    updated
  );
}

export async function changeLocalPassword(
  oldPassword: string,
  newPassword: string
) {
  const session =
    getLocalSession();

  if (
    !session
  ) {
    throw new Error(
      "Chưa đăng nhập."
    );
  }

  const problems =
    validateLocalPassword(
      newPassword
    );

  if (
    problems.length >
    0
  ) {
    throw new Error(
      `Mật khẩu mới cần ${problems.join(
        ", "
      )}.`
    );
  }

  const users =
    readUsers();

  const index =
    users.findIndex(
      (user) =>
        user.id ===
        session.id
    );

  if (
    index <
    0
  ) {
    throw new Error(
      "Không tìm thấy tài khoản."
    );
  }

  const user =
    users[
      index
    ];

  const oldHash =
    await passwordHash(
      oldPassword,
      user.passwordSalt
    );

  if (
    oldHash !==
    user.passwordHash
  ) {
    throw new Error(
      "Mật khẩu hiện tại không đúng."
    );
  }

  const salt =
    randomHex();

  const updated:
    StoredLocalUser =
      {
        ...user,
        passwordSalt:
          salt,
        passwordHash:
          await passwordHash(
            newPassword,
            salt
          ),
        updatedAt:
          new Date().toISOString(),
      };

  const next =
    [...users];

  next[
    index
  ] =
    updated;

  writeUsers(
    next
  );

  updateStoredSession(
    updated
  );
}

export async function deleteLocalAccount(
  password: string
) {
  const session =
    getLocalSession();

  if (
    !session
  ) {
    throw new Error(
      "Chưa đăng nhập."
    );
  }

  const users =
    readUsers();

  const user =
    users.find(
      (item) =>
        item.id ===
        session.id
    );

  if (
    !user
  ) {
    throw new Error(
      "Không tìm thấy tài khoản."
    );
  }

  const hash =
    await passwordHash(
      password,
      user.passwordSalt
    );

  if (
    hash !==
    user.passwordHash
  ) {
    throw new Error(
      "Mật khẩu xác nhận không đúng."
    );
  }

  writeUsers(
    users.filter(
      (item) =>
        item.id !==
        user.id
    )
  );

  logoutLocalUser();
}
