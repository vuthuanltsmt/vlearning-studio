import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AuthError, requireSameOrigin } from "@/lib/authServer";
import { requireLessonAuthor, validateLessonInput } from "@/lib/aiLessonAccess";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function fail(error:unknown) {
  if(error instanceof AuthError) return NextResponse.json({ok:false,error:error.message},{status:error.status});
  console.error(error);
  return NextResponse.json({ok:false,error:"Lỗi máy chủ."},{status:500});
}
export async function GET() {
  try {const user=await requireLessonAuthor();const data=await db.aiLessonPlan.findMany({where:{ownerUserId:user.id},orderBy:{updatedAt:"desc"},take:100});return NextResponse.json({ok:true,data});}catch(error){return fail(error);}
}
export async function POST(request:NextRequest) {
  try {
    await requireSameOrigin(request);const user=await requireLessonAuthor();
    const body=validateLessonInput(await request.json());
    const data=await db.aiLessonPlan.create({data:{ownerUserId:user.id,...body}});
    return NextResponse.json({ok:true,data},{status:201});
  } catch(error){return fail(error);}
}
