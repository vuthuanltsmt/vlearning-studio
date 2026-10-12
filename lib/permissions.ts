export type AccessRole =
  | "ADMIN"
  | "TEACHER"
  | "LEARNER";

export const ACCESS_ROLE_LABELS:
  Record<
    AccessRole,
    string
  > =
    {
      ADMIN:
        "Quản trị viên",
      TEACHER:
        "Giáo viên",
      LEARNER:
        "Học viên",
    };

export function isAccessRole(
  value: unknown
): value is AccessRole {
  return (
    value ===
      "ADMIN" ||
    value ===
      "TEACHER" ||
    value ===
      "LEARNER"
  );
}

export function canAuthor(
  role:
    | AccessRole
    | null
    | undefined
) {
  return (
    role ===
      "ADMIN" ||
    role ===
      "TEACHER"
  );
}

export function canManageUsers(
  role:
    | AccessRole
    | null
    | undefined
) {
  return role ===
    "ADMIN";
}
