import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {AuthError,requireSameOrigin} from "@/lib/authServer";
import {requireLessonAuthor,validateLessonInput} from "@/lib/aiLessonAccess";
export const runtime="nodejs";
type C={params:Promise<{id:string}>};
function fail(e:unknown){if(e instanceof AuthError)return NextResponse.json({ok:false,error:e.message},{status:e.status});console.error(e);return NextResponse.json({ok:false,error:"Lỗi máy chủ."},{status:500});}
export async function PATCH(req:NextRequest,ctx:C){
 try{await requireSameOrigin(req);const user=await requireLessonAuthor();const {id}=await ctx.params;
 const data=validateLessonInput(await req.json());
 const changed=await db.aiLessonPlan.updateMany({where:{id,ownerUserId:user.id},data});
 if(!changed.count)throw new AuthError("Không tìm thấy bài dạy.",404);
 return NextResponse.json({ok:true});}catch(e){return fail(e);}
}
export async function DELETE(req:NextRequest,ctx:C){
 try{await requireSameOrigin(req);const user=await requireLessonAuthor();const {id}=await ctx.params;
 await db.$transaction(async tx=>{
  const found=await tx.aiLessonPlan.findFirst({where:{id,ownerUserId:user.id},select:{id:true}});
  if(!found)throw new AuthError("Không tìm thấy bài dạy.",404);
  await tx.aiLessonSource.updateMany({where:{ownerUserId:user.id,lessonId:id},data:{lessonId:null}});
  await tx.aiLessonPlan.delete({where:{id}});
 });
 return NextResponse.json({ok:true});}catch(e){return fail(e);}
}
