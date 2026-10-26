import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {AuthError,requireSameOrigin} from "@/lib/authServer";
import {requireLessonAuthor} from "@/lib/aiLessonAccess";
export const runtime="nodejs";
type C={params:Promise<{id:string}>};
export async function DELETE(req:NextRequest,ctx:C){
 try{await requireSameOrigin(req);const user=await requireLessonAuthor();const {id}=await ctx.params;const result=await db.aiLessonSource.deleteMany({where:{id,ownerUserId:user.id}});if(!result.count)throw new AuthError("Không tìm thấy tài liệu.",404);return NextResponse.json({ok:true});}
 catch(e){if(e instanceof AuthError)return NextResponse.json({ok:false,error:e.message},{status:e.status});console.error(e);return NextResponse.json({ok:false,error:"Lỗi máy chủ."},{status:500});}
}
