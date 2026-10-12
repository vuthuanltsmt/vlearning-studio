import "../../globals.css";

import type {
  ReactNode,
} from "react";

import {
  redirect,
} from "next/navigation";

import {
  serverUserForGuard,
} from "@/lib/authServer";

import {
  canAuthor,
} from "@/lib/permissions";

export const dynamic =
  "force-dynamic";

export default async function EditorDemoLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  const user =
    await serverUserForGuard();

  if (
    !user
  ) {
    redirect(
      "/projects?auth=required"
    );
  }

  if (
    !canAuthor(
      user.accessRole
    )
  ) {
    redirect(
      "/projects?denied=authoring"
    );
  }

  return children;
}
