"use client";
import {useState} from "react";
import Link from "next/link";
import {createPptx,readDocx,type SlideContent} from "@/lib/wordToPptx";
export default function WordToPptPage(){
 const [slides,setSlides]=useState<SlideContent[]>([]);
 const [filename,setFilename]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function upload(file:File){
  setError("");setSlides([]);setFilename(file.name);
  if(!/\.docx$/i.test(file.name)){setError("Vui lòng chọn Word .docx; định dạng .doc chưa được hỗ trợ.");return;}
  setBusy(true);
  try{const result=await readDocx(file);if(!result.length)throw Error("Tệp Word không có nội dung văn bản.");setSlides(result);}
  catch(e){setError(e instanceof Error?e.message:"Không đọc được tệp Word.");}
  finally{setBusy(false);}
 }
 async function download(){
  setBusy(true);setError("");
  try{const blob=await createPptx(slides),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename.replace(/\.docx$/i,"")+".pptx";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  catch(e){setError(e instanceof Error?e.message:"Không tạo được PowerPoint.");}
  finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-[#06182f] px-5 py-8 text-white">
  <div className="mx-auto max-w-5xl space-y-6">
   <header className="rounded-2xl bg-[#102f55] p-6">
    <Link href="/projects" className="text-cyan-300">← Quay lại VLearning Studio</Link>
    <h1 className="mt-3 text-3xl font-bold">Chuyển Word thành PowerPoint</h1>
    <p className="mt-2 text-slate-300">Tạo slide 16:9 từ tiêu đề và các đoạn nội dung của tệp .docx. Xử lý ngay trong trình duyệt, không tải Word lên máy chủ.</p>
   </header>
   <section className="rounded-2xl border border-blue-700 bg-[#0c2a4d] p-6">
    <label className="block text-lg font-semibold" htmlFor="docx-file">1. Chọn tài liệu Word (.docx)</label>
    <input id="docx-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}} className="mt-4 block w-full rounded-xl border border-slate-500 p-3 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-semibold file:text-white"/>
    {filename&&<p className="mt-3 text-sm text-slate-300">Đã chọn: {filename}</p>}
    {error&&<p role="alert" className="mt-3 rounded bg-red-950 p-3 text-red-200">{error}</p>}
   </section>
   {slides.length>0&&<section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">2. Xem trước ({slides.length} slide)</h2><button disabled={busy} onClick={()=>void download()} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold hover:bg-emerald-500 disabled:opacity-50">{busy?"Đang xử lý...":"Tải PowerPoint .pptx"}</button></div>
    <div className="grid gap-4 md:grid-cols-2">{slides.map((s,i)=><article key={i} className="aspect-video overflow-hidden rounded-xl border border-slate-400 bg-white text-slate-900"><div className="bg-[#123B68] px-4 py-3 font-bold text-white">{i+1}. {s.title}</div><ul className="list-disc space-y-1 px-8 py-3 text-sm">{s.bullets.slice(0,6).map((x,j)=><li key={j} className="line-clamp-2">{x}</li>)}</ul></article>)}</div>
    <p className="text-sm text-slate-300">MVP chuyển văn bản và tiêu đề thành slide có thể chỉnh sửa. Bảng, ảnh, sơ đồ và bố cục phức tạp trong Word chưa được chuyển nguyên dạng. Giới hạn 10 MB và tối đa 80 slide.</p>
   </section>}
  </div>
 </main>;
}