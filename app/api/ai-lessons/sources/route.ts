import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {AuthError,requireSameOrigin} from "@/lib/authServer";
import {requireLessonAuthor} from "@/lib/aiLessonAccess";
export const runtime="nodejs";
const MAX=5*1024*1024;
const types:Record<string,string>={"application/pdf":"pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx","text/plain":"txt"};
function fail(e:unknown){if(e instanceof AuthError)return NextResponse.json({ok:false,error:e.message},{status:e.status});console.error(e);return NextResponse.json({ok:false,error:"Lỗi máy chủ."},{status:500});}
export async function GET(){
 try{const user=await requireLessonAuthor();const data=await db.aiLessonSource.findMany({where:{ownerUserId:user.id},select:{id:true,filename:true,mimeType:true,sizeBytes:true,lessonId:true,createdAt:true},orderBy:{createdAt:"desc"},take:100});return NextResponse.json({ok:true,data});}catch(e){return fail(e);}
}
export async function POST(req:NextRequest){
 try{await requireSameOrigin(req);const user=await requireLessonAuthor();const form=await req.formData();const file=form.get("file");
 if(!(file instanceof File))throw new AuthError("Chưa chọn tệp.",400);
 const extension=file.name.toLowerCase().split(".").pop();
 if(!types[file.type]||types[file.type]!==extension)throw new AuthError("Chỉ nhận PDF, DOCX hoặc TXT.",400);
 if(file.size===0||file.size>MAX)throw new AuthError("Tệp phải có dung lượng từ 1 byte đến 5 MB.",400);
 const filename=file.name.slice(0,180);
 const lessonId=String(form.get("lessonId")||"");
 if(lessonId&&!await db.aiLessonPlan.findFirst({where:{id:lessonId,ownerUserId:user.id},select:{id:true}}))throw new AuthError("Bài dạy không hợp lệ.",404);
 const bytes=Buffer.from(await file.arrayBuffer());
 const looksPdf=extension==="pdf"&&bytes.subarray(0,5).toString()==="%PDF-";
 const looksZip=extension==="docx"&&bytes.subarray(0,2).toString()==="PK";
 if((extension==="pdf"&&!looksPdf)||(extension==="docx"&&!looksZip))throw new AuthError("Nội dung tệp không đúng định dạng.",400);
 const data=await db.aiLessonSource.create({data:{ownerUserId:user.id,lessonId:lessonId||null,filename,mimeType:file.type,sizeBytes:bytes.length,data:bytes},select:{id:true,filename:true,mimeType:true,sizeBytes:true,lessonId:true,createdAt:true}});
 return NextResponse.json({ok:true,data},{status:201});
 }catch(e){return fail(e);}
}
