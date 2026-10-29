import {NextRequest,NextResponse} from "next/server";
import {AuthError,requireSameOrigin} from "@/lib/authServer";
import {requireLessonAuthor} from "@/lib/aiLessonAccess";
import {lessonDocx} from "@/lib/lessonDocx";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 try {
  await requireSameOrigin(req);await requireLessonAuthor();
  const body:unknown=await req.json();
  if(!body||typeof body!=="object"||Array.isArray(body))throw new AuthError("Dữ liệu không hợp lệ.",400);
  const v=body as Record<string,unknown>;
  if(typeof v.title!=="string"||!v.title.trim()||v.title.length>200||!Array.isArray(v.sections)||v.sections.length>30)throw new AuthError("Giáo án không hợp lệ.",400);
  const sections=v.sections.map((x:unknown)=>{
   if(!x||typeof x!=="object"||Array.isArray(x))throw new AuthError("Mục không hợp lệ.",400);
   const a=x as Record<string,unknown>;
   if(typeof a.heading!=="string"||a.heading.length>160||typeof a.content!=="string"||a.content.length>25000)throw new AuthError("Nội dung mục quá dài.",400);
   return {heading:a.heading,content:a.content};
  });
  if(!sections.some(s=>s.content.trim().length>0))throw new AuthError("Giáo án chưa có nội dung; hãy nạp bản nháp Cloud hoặc nhập nội dung trước khi xuất Word.",400);
  const file=await lessonDocx(v.title,sections);
  return new NextResponse(Buffer.from(file),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":"attachment; filename=\"giao-an-v13-2.docx\"","Cache-Control":"no-store"}});
 }catch(e){if(e instanceof AuthError)return NextResponse.json({ok:false,error:e.message},{status:e.status});console.error("lesson docx export",e instanceof Error?e.name:"unknown");return NextResponse.json({ok:false,error:"Không thể xuất Word."},{status:500});}
}
