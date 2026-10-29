import {NextRequest,NextResponse} from "next/server";
import {AuthError,requireSameOrigin} from "@/lib/authServer";
import {requireLessonAuthor} from "@/lib/aiLessonAccess";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 try{
  await requireSameOrigin(req);await requireLessonAuthor();
  const body:unknown=await req.json();
  if(!body||typeof body!=="object"||Array.isArray(body))throw new AuthError("Dữ liệu không hợp lệ.",400);
  const b=body as Record<string,unknown>;
  if(typeof b.text!=="string"||b.text.length<20||b.text.length>24000)throw new AuthError("Giáo án cần từ 20 đến 24.000 ký tự.",400);
  const key=process.env.GEMINI_API_KEY?.trim();
  if(!key)return NextResponse.json({ok:false,error:"Chưa cấu hình GEMINI_API_KEY."},{status:503});
  const model=process.env.GEMINI_LESSON_MODEL?.trim()||"gemini-3.5-flash-lite";
  if(!/^[a-zA-Z0-9._-]+$/.test(model))throw new AuthError("Mô hình không hợp lệ.",500);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);
  let res:Response;
  try{res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{method:"POST",signal:controller.signal,headers:{"x-goog-api-key":key,"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"Tạo chính xác 5 câu trắc nghiệm tiếng Việt từ giáo án sau. Trả về duy nhất JSON hợp lệ dạng { \"questions\": [{\"question\": \"...\", \"options\":[\"A\",\"B\",\"C\",\"D\"], \"correctIndex\":0, \"explanation\":\"...\"}] }. correctIndex từ 0 đến 3. Không thêm markdown hoặc dữ liệu không được suy ra từ giáo án.\n"+b.text}]}],generationConfig:{temperature:0.2,responseMimeType:"application/json",maxOutputTokens:2400}})});}finally{clearTimeout(timer);}
  if(!res.ok)return NextResponse.json({ok:false,error:"Gemini trả HTTP "+res.status+" khi tạo câu hỏi."},{status:502});
  const data=await res.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>} ;
  const raw=data.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";
  let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new AuthError("Gemini trả JSON không hợp lệ.",502);}
  const q=(parsed as {questions?:unknown})?.questions;
  if(!Array.isArray(q)||q.length!==5||!q.every(x=>x&&typeof x.question==="string"&&Array.isArray(x.options)&&x.options.length===4&&x.options.every((y:unknown)=>typeof y==="string")&&Number.isInteger(x.correctIndex)&&x.correctIndex>=0&&x.correctIndex<4&&typeof x.explanation==="string"))throw new AuthError("Định dạng câu hỏi Gemini không hợp lệ.",502);
  return NextResponse.json({ok:true,data:{questions:q}});
 }catch(e){if(e instanceof AuthError)return NextResponse.json({ok:false,error:e.message},{status:e.status});if(e instanceof Error&&e.name==="AbortError")return NextResponse.json({ok:false,error:"Gemini quá thời gian."},{status:504});console.error("quiz generation",e instanceof Error?e.name:"unknown");return NextResponse.json({ok:false,error:"Không thể tạo trắc nghiệm."},{status:500});}
}
