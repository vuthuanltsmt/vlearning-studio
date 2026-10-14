import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { serverUserForGuard } from "@/lib/authServer";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const user = await serverUserForGuard();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { slug } = await context.params;
  const project = await db.cloudProject.findFirst({
    where: { publicSlug: slug, isPublished: true },
    select: { id: true, projectId: true, title: true, snapshotJson: true, version: true, publishedAt: true, updatedAt: true },
  });

  if (!project) {
    return NextResponse.json({ ok: false, error: "Không tìm thấy bài học đã xuất bản." }, { status: 404 });
  }

  let snapshot = null;
  try { snapshot = JSON.parse(project.snapshotJson); } catch {}

  return NextResponse.json({
    ok: true,
    data: {
      id: project.id,
      projectId: project.projectId,
      title: project.title,
      version: project.version,
      publishedAt: project.publishedAt,
      updatedAt: project.updatedAt,
      snapshot,
    },
  });
}
