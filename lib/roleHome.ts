import type { AccessRole } from "@/lib/permissions";

export function roleHomeFor(role: AccessRole) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "LEARNER":
    default:
      return "/learn";
  }
}
