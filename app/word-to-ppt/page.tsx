"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,BookOpen,CheckCircle2,ChevronDown,Download,FileText,MonitorPlay,Plus,ShieldCheck,Trash2,UploadCloud,AlertTriangle} from "lucide-react";
import {readDocx,type SlideContent} from "@/lib/wordToPptx";
import {createStandardPptx,type DesignPreset,type SlideLayout} from "@/lib/wordToPptxStandard";
import {planLessonSlides,STAGE_NAMES,type PlannedSlide} from "@/lib/lessonSlidePlanner";
type Mode="lesson"|"basic";
const phaseLabels=["01 · Tài liệu nguồn","02 · Kế hoạch slide","03 · Kiểm duyệt và xuất PPTX"];
export default function WordToPptPage(){
 const [source,setSource]=useState<SlideContent[]>([]);
 const [slides,setSlides]=useState<PlannedSlide[]>([]);
 const [filename,setFilename]=useState("");
 const [mode,setMode]=useState<Mode>("lesson");
 const [preset,setPreset]=useState<DesignPreset>("ocean");
 const [layouts,setLayouts]=useState<Record<number,SlideLayout>>({});
 const [warnings,setWarnings]=useState<string[]>([]);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState(0);
 const [phase,setPhase]=useState(0);
 const [approved,setApproved]=useState(false);
 const active=slides[selected];
 const totalBullets=useMemo(()=>slides.reduce((n,s)=>n+s.bullets.length,0),[slides]);
 function arrange(input:SlideContent[],name:string,m:Mode){
   if(m==="basic"){setSlides(input.map(x=>({...x,stage:"task" as const,note:"Nội dung chuyển trực tiếp từ Word",sourceHeading:x.title})));setWarnings(["Chế độ chuyển nhanh không xây dựng tiến trình dạy học."]);}
   else{const plan=planLessonSlides(input,name);setSlides(plan.slides);setWarnings(plan.warnings);}
   setSelected(0);setApproved(false);setPhase(1);
 }
 async function upload(file:File){
   setError("");setFilename(file.name);setSource([]);setSlides([]);setApproved(false);
   if(!/\.docx$/i.test(file.name)){setError("Chỉ hỗ trợ Word .docx. Vui lòng chuyển định dạng .doc sang .docx.");return;}
   setBusy(true);
   try{const result=await readDocx(file);if(!result.some(x=>x.title||x.bullets.length))throw Error("Tài liệu Word không có văn bản có thể đọc.");setSource(result);arrange(result,file.name,mode);}
   catch(e){setError(e instanceof Error?e.message:"Không đọc được Word.");}
   finally{setBusy(false);}
 }
 function setModeAndReplan(value:Mode){setMode(value);if(source.length)arrange(source,filename,value);}
 function edit(patch:Partial<PlannedSlide>){setApproved(false);setSlides(x=>x.map((s,i)=>i===selected?{...s,...patch}:s));}
 function remove(){if(slides.length===1)return;setSlides(x=>x.filter((_,i)=>i!==selected));setSelected(x=>Math.max(0,x-1));setApproved(false);}
 function add(){const entry:PlannedSlide={title:"SLIDE MỚI",bullets:["[Nhập nội dung chính]"],stage:"task",note:"Slide do giáo viên thêm",sourceHeading:""};setSlides(x=>[...x.slice(0,selected+1),entry,...x.slice(selected+1)]);setSelected(selected+1);setApproved(false);}
 async function download(){
  setError("");if(!approved){setError("Vui lòng đánh dấu đã kiểm duyệt nội dung trước khi xuất.");return;}
  if(!slides.length)return;
  setBusy(true);
  try{const blob=await createStandardPptx(slides.map((s,i)=>({...s,layout:layouts[i]||"auto"})),preset),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(filename.replace(/\.docx$/i,"")||"bai-giang")+"-vlearning.pptx";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  catch(e){setError(e instanceof Error?e.message:"Không tạo được PPTX.");}finally{setBusy(false);}
 }
 return <main className="min-h-screen bg-[#07192e] pb-20 text-slate-50">
  <header className="border-b border-white/10 bg-[#0d2b4c]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-500/15 p-3 text-cyan-300"><MonitorPlay size={23}/></div><div><div className="text-xs font-bold uppercase tracking-widest text-cyan-300">VLearning Studio · Học liệu số</div><h1 className="text-xl font-extrabold">Word → PowerPoint</h1></div></div>
    <Link href="/projects" className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"><ArrowLeft size={16}/> Dự án VLearning</Link>
   </div></header>
  <div className="mx-auto max-w-7xl space-y-6 px-5 pt-7">
   <section className="rounded-2xl border border-cyan-700/40 bg-gradient-to-r from-[#103b65] via-[#12365c] to-[#182f5b] p-6 shadow-xl md:p-8">
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300"><BookOpen size={16}/> Thiết kế bài giảng THCS / THPT <span className="rounded-full bg-white/10 px-2 py-1 text-white">Bản thử nghiệm</span></div>
    <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">Từ tài liệu Word đến bài giảng có hoạt động học</h2>
    <p className="mt-3 max-w-3xl text-slate-300">Theo quy trình PROMPT MASTER: đọc nguồn → lập kế hoạch → khởi động → khám phá → thảo luận → chốt kiến thức → luyện tập → vận dụng. Giáo viên kiểm duyệt trước khi xuất tệp chỉnh sửa được.</p>
   </section>
   <nav aria-label="Quy trình chuyển đổi" className="grid grid-cols-1 gap-3 md:grid-cols-3">{phaseLabels.map((label,i)=><button key={i} disabled={i>0&&!source.length} onClick={()=>setPhase(i)} className={"rounded-xl border px-4 py-3 text-left text-sm font-semibold transition "+(phase===i?"border-cyan-400 bg-cyan-900/50 text-cyan-100":"border-white/10 bg-[#102b48] text-slate-300 hover:bg-[#183b60] disabled:opacity-50")}>{label}</button>)}</nav>
   {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/50 bg-red-950/70 p-4 text-sm text-red-100"><AlertTriangle size={18}/>{error}</div>}
   {phase===0&&<div className="grid gap-5 lg:grid-cols-3"><section className="rounded-2xl border border-white/10 bg-[#102b48] p-6 lg:col-span-2">
    <h3 className="text-lg font-bold">Tải lên tài liệu Word</h3><p className="mt-1 text-sm text-slate-400">Chỉ chấp nhận tệp .docx, tối đa 10 MB. Văn bản được xử lý ngay trong trình duyệt.</p>
    <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/50 bg-[#081d36] p-10 text-center hover:bg-[#103454]"><UploadCloud size={40} className="text-cyan-300"/><span className="font-bold">Chọn tệp Word để thiết kế bài giảng</span><span className="text-xs text-slate-400">Nhấp vào đây để chọn .docx</span><input type="file" accept=".docx" className="sr-only" onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void upload(file);}}/></label>
    {filename&&<p className="mt-3 text-sm text-cyan-200"><FileText size={15} className="mr-1 inline"/>{filename}</p>}
   </section><aside className="space-y-4 rounded-2xl border border-white/10 bg-[#102b48] p-6"><h3 className="font-bold">Chế độ chuyển đổi</h3>
    <label className="flex cursor-pointer gap-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-4"><input type="radio" checked={mode==="lesson"} onChange={()=>setModeAndReplan("lesson")}/><span><strong>Thiết kế bài giảng</strong><small className="mt-1 block text-slate-400">Tạo tiến trình, nhiệm vụ và slide chốt theo nội dung nguồn</small></span></label>
    <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-4"><input type="radio" checked={mode==="basic"} onChange={()=>setModeAndReplan("basic")}/><span><strong>Chuyển văn bản nhanh</strong><small className="mt-1 block text-slate-400">Chuyển theo các tiêu đề trong Word, không lập hoạt động</small></span></label>
    <p className="text-xs text-amber-200">MVP chưa chuyển nguyên trạng ảnh, bản đồ, biểu đồ và bảng từ Word. Những vị trí thiếu cần giáo viên bổ sung.</p>
   </aside></div>}
   {source.length>0&&phase===1&&<section className="space-y-4">
     <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-xl font-bold">Kế hoạch trình chiếu</h3><p className="text-sm text-slate-400">{slides.length} slide · {totalBullets} ý chính · Biên tập trực tiếp trước khi xuất</p></div><button onClick={()=>setPhase(2)} className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-[#07192e] hover:bg-cyan-400">Tiếp tục kiểm duyệt →</button></div>
     <div className="flex flex-wrap items-center gap-4 rounded-xl border border-cyan-700/40 bg-[#102b48] p-4"><label className="text-sm font-semibold">Mẫu giao diện <select value={preset} onChange={e=>{setPreset(e.target.value as DesignPreset);setApproved(false);}} className="ml-3 rounded-lg border border-slate-500 bg-[#07192e] px-3 py-2"><option value="ocean">Đại dương · Xanh dương</option><option value="forest">Thiên nhiên · Xanh lá</option><option value="sunrise">Sáng tạo · Cam tím</option></select></label><label className="text-sm font-semibold">Bố cục slide hiện tại <select value={layouts[selected]||"auto"} onChange={e=>{setLayouts(x=>({...x,[selected]:e.target.value as SlideLayout}));setApproved(false);}} className="ml-3 rounded-lg border border-slate-500 bg-[#07192e] px-3 py-2"><option value="auto">Tự chọn theo hoạt động</option><option value="cards">Thẻ kiến thức</option><option value="two-column">Hai cột · Học liệu + nhiệm vụ</option><option value="timeline">Quy trình / Timeline</option><option value="focus">Một thông điệp trọng tâm</option></select></label><p className="w-full text-xs text-slate-400">Tùy chọn này được áp dụng khi xuất PPTX. Bản xem trước bên dưới hiện chỉ minh họa nội dung, chưa mô phỏng chính xác bố cục đã chọn.</p></div>
     {warnings.map((w,i)=><div key={i} className="rounded-lg border border-amber-500/30 bg-amber-900/15 px-4 py-3 text-sm text-amber-200">Lưu ý: {w}</div>)}
     <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
       <aside className="max-h-[650px] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#102b48] p-3">{slides.map((s,i)=><button key={i} onClick={()=>setSelected(i)} className={"w-full rounded-xl border p-3 text-left "+(selected===i?"border-cyan-400 bg-cyan-900/40":"border-white/5 bg-[#081e36] hover:bg-[#163858]")}><span className="text-xs text-cyan-300">{String(i+1).padStart(2,"0")} · {STAGE_NAMES[s.stage]}</span><span className="mt-1 block truncate text-sm font-semibold">{s.title}</span></button>)}</aside>
       <div className="space-y-4"><div className="aspect-video overflow-hidden rounded-2xl border border-slate-500 bg-white shadow-2xl"><div className="flex h-[22%] items-center bg-[#123B68] px-[5%]"><h4 className="line-clamp-2 text-lg font-bold text-white md:text-3xl">{active?.title}</h4></div><div className="flex h-[78%] flex-col justify-center px-[8%] py-4 text-[#183255]">{active?.bullets.length?<ul className="list-disc space-y-2 text-sm md:text-xl">{active.bullets.slice(0,6).map((x,j)=><li key={j} className="line-clamp-2">{x}</li>)}</ul>:<p className="text-xl text-slate-500">Slide bìa / tiêu đề</p>}</div></div>
        <div className="rounded-2xl border border-white/10 bg-[#102b48] p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><strong>Biên tập slide {selected+1}</strong><div className="flex gap-2"><button onClick={add} className="flex items-center gap-1 rounded-lg bg-cyan-800 px-3 py-2 text-xs font-bold"><Plus size={14}/> Thêm</button><button disabled={slides.length<2} onClick={remove} className="flex items-center gap-1 rounded-lg bg-red-950 px-3 py-2 text-xs font-bold disabled:opacity-40"><Trash2 size={14}/> Xóa</button></div></div>
         <label className="block text-sm font-semibold text-slate-200">Tiêu đề slide<input value={active?.title||""} onChange={e=>edit({title:e.target.value})} className="mt-2 w-full rounded-lg border border-slate-600 bg-[#07192e] p-3"/></label>
         <label className="mt-4 block text-sm font-semibold text-slate-200">Nội dung chính — mỗi dòng một ý<textarea value={active?.bullets.join("\n")||""} onChange={e=>edit({bullets:e.target.value.split("\n").filter(Boolean).slice(0,6)})} rows={6} className="mt-2 w-full rounded-lg border border-slate-600 bg-[#07192e] p-3"/></label>
         <p className="mt-4 text-sm text-slate-400"><ShieldCheck size={16} className="mr-1 inline"/> Nguồn: {active?.sourceHeading||"Khung hoạt động đề xuất"} · {active?.note}</p>
        </div>
       </div>
     </div>
   </section>}
   {source.length>0&&phase===2&&<section className="grid gap-5 lg:grid-cols-[1fr_360px]">
    <div className="rounded-2xl border border-white/10 bg-[#102b48] p-6"><h3 className="text-xl font-bold">Kiểm duyệt trước khi xuất</h3><p className="mt-2 text-sm text-slate-400">Đối chiếu từng mục với tài liệu gốc. Không tự động khẳng định nội dung, câu hỏi hay phương pháp là chính xác khi giáo viên chưa rà soát.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{slides.map((s,i)=><button key={i} onClick={()=>{setSelected(i);setPhase(1);}} className="rounded-lg border border-white/10 bg-[#07192e] p-3 text-left hover:border-cyan-400"><span className="text-xs text-cyan-300">Slide {i+1} · {STAGE_NAMES[s.stage]}</span><span className="mt-1 block line-clamp-2 text-sm font-semibold">{s.title}</span></button>)}</div>
    </div><aside className="h-fit space-y-5 rounded-2xl border border-cyan-500/30 bg-[#113653] p-6"><h3 className="text-xl font-bold">Xuất PowerPoint</h3><div className="space-y-2 text-sm text-slate-300"><div className="flex justify-between"><span>Định dạng</span><strong>.pptx · 16:9</strong></div><div className="flex justify-between"><span>Slide</span><strong>{slides.length}</strong></div><div className="flex justify-between"><span>Văn bản</span><strong>Chỉnh sửa được</strong></div></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-500/30 p-4 text-sm"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)} className="mt-1"/><span>Tôi đã rà soát tên bài, mục lớn/mục nhỏ, câu hỏi, kiến thức và các slide cần bổ sung.</span></label><button disabled={!approved||busy||!slides.length} onClick={()=>void download()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 font-extrabold text-[#092039] hover:bg-emerald-400 disabled:opacity-40"><Download size={20}/>{busy?"Đang xuất...":"Tải PowerPoint .pptx"}</button><p className="text-xs text-slate-300">Tệp PPTX được dựng cục bộ. Chưa hỗ trợ ảnh gốc, biểu đồ, animation và bảng Word phức tạp.</p></aside>
   </section>}
   {source.length>0&&phase===0&&<button onClick={()=>setPhase(1)} className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#081b31]">Xem kế hoạch slide <ChevronDown size={16} className="ml-2 inline"/> </button>}
  </div>
 </main>;
}
