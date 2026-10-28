"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {BookOpen,FileText,FolderOpen,Plus,Trash2,UploadCloud,Save,RefreshCw,ArrowLeft,Sparkles} from "lucide-react";

type Lesson={id:string;title:string;subject:string;grade:string;periods:number;textbook:string;objectives:string;updatedAt:string;status:string};
type Source={id:string;filename:string;sizeBytes:number;createdAt:string;lessonId:string|null};
type Tab="overview"|"sources"|"setup";
const blank={title:"",subject:"",grade:"",periods:1,textbook:"",objectives:""};
async function call<T>(url:string,options?:RequestInit):Promise<T>{
 let response:Response;
 try {
  response=await fetch(url,{credentials:"same-origin",cache:"no-store",redirect:"follow",...options});
 } catch {
  throw new Error("Không kết nối được API Cloud. Nếu đang ở bản Preview, hãy đăng nhập Vercel trên cùng tên miền rồi tải lại trang; kiểm tra mạng nếu lỗi vẫn xảy ra.");
 }
 const type=response.headers.get("content-type")||"";
 if(!type.includes("application/json")){
  throw new Error("API Cloud không trả JSON (có thể bị chuyển đến trang xác thực Vercel Preview). Hãy đăng nhập Vercel trên cùng tên miền và tải lại trang.");
 }
 const body=await response.json().catch(()=>({ok:false,error:"Phản hồi JSON không hợp lệ."}));
 if(!response.ok||!body.ok)throw new Error(body.error||("API Cloud trả lỗi HTTP "+response.status+"."));
 return body.data as T;
}
export default function AiLessonStudio(){
 const [tab,setTab]=useState<Tab>("overview");
 const [lessons,setLessons]=useState<Lesson[]>([]);
 const [sources,setSources]=useState<Source[]>([]);
 const [draft,setDraft]=useState({...blank});
 const [editing,setEditing]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [authorized,setAuthorized]=useState<boolean|null>(null);
 const [loaded,setLoaded]=useState(false);
 const reload=useCallback(async()=>{
   const [l,s]=await Promise.all([call<Lesson[]>("/api/ai-lessons"),call<Source[]>("/api/ai-lessons/sources")]);
   setLessons(l);setSources(s);setLoaded(true);
 },[]);
 useEffect(()=>{
  let mounted=true;
  (async()=>{try{
    const r=await fetch("/api/auth/me",{credentials:"same-origin",cache:"no-store"});
    if(!(r.headers.get("content-type")||"").includes("application/json"))throw new Error("Không xác thực được trên Preview. Hãy đăng nhập Vercel trên đúng tên miền rồi tải lại trang.");
    const j=await r.json();
    if(!mounted)return;
    const allowed=!!j.user&&["ADMIN","TEACHER"].includes(j.user.accessRole);
    setAuthorized(allowed);
    if(allowed)await reload();
  }catch(e){if(mounted)setError(e instanceof Error?e.message:"Không kết nối được.");}})();
  return ()=>{mounted=false;};
 },[reload]);
 async function action(fn:()=>Promise<void>){
  setBusy(true);setError("");setMessage("");
  try{await fn();}catch(e){setError(e instanceof Error?e.message:"Có lỗi xảy ra.");}
  finally{setBusy(false);}
 }
 function beginNew(){setDraft({...blank});setEditing(null);setTab("setup");setError("");}
 function edit(l:Lesson){setDraft({title:l.title,subject:l.subject,grade:l.grade,periods:l.periods,textbook:l.textbook,objectives:l.objectives});setEditing(l.id);setTab("setup");}
 function save(){void action(async()=>{
  const url=editing?"/api/ai-lessons/"+editing:"/api/ai-lessons";
  await call(url,{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});
  await reload();setMessage("Đã lưu bản nháp lên Cloud.");setTab("overview");
 });}
 function remove(id:string){if(!window.confirm("Xóa bài dạy này? Tài liệu nguồn sẽ được giữ lại."))return;void action(async()=>{await call("/api/ai-lessons/"+id,{method:"DELETE"});await reload();setMessage("Đã xóa bài dạy.");});}
 function upload(file:File|null){if(!file)return;void action(async()=>{
  const valid=["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];
  if(!valid.includes(file.type)||file.size>5*1024*1024||file.size===0)throw new Error("Chỉ nhận PDF, DOCX, TXT tối đa 5 MB.");
  const form=new FormData();form.append("file",file);
  await call("/api/ai-lessons/sources",{method:"POST",body:form});await reload();setMessage("Đã lưu tài liệu riêng tư.");
 });}
 function deleteSource(id:string){if(!window.confirm("Xóa tài liệu khỏi kho nguồn?"))return;void action(async()=>{await call("/api/ai-lessons/sources/"+id,{method:"DELETE"});await reload();setMessage("Đã xóa tài liệu.");});}
 return <main className="min-h-screen bg-[#06182f] px-4 py-6 text-slate-100 md:px-8">
  <div className="mx-auto max-w-6xl space-y-6">
   <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-700/40 bg-[#102f55] p-5">
    <div><Link href="/projects" className="flex items-center gap-2 text-xs text-cyan-300"><ArrowLeft size={15}/> VLearning Studio</Link>
    <h1 className="mt-2 flex items-center gap-2 text-2xl font-black"><Sparkles className="text-cyan-300"/> AI Lesson Studio</h1>
    <p className="mt-1 text-sm text-slate-300">V13.0A · Kho nguồn và quản lý giáo án Cloud · Chưa kích hoạt AI</p></div>
    <button onClick={beginNew} disabled={!authorized||busy} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-bold disabled:opacity-40"><Plus size={18}/> Tạo bài dạy</button>
   </header>
   {authorized===false&&<div role="alert" className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-900/20 p-4">
    <p className="font-semibold">Bạn chưa đăng nhập hoặc tài khoản chưa có quyền sử dụng AI Lesson Studio.</p>
    <p className="text-sm text-slate-300">Đăng nhập trên cùng tên miền Preview bằng tài khoản có quyền giáo viên hoặc quản trị viên. Sau đó quay lại trang này và tải lại.</p>
    <Link href="/projects" className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500">Mở VLearning để đăng nhập <ArrowLeft size={16}/></Link>
   </div>}
   {authorized===null&&<p>Đang kiểm tra quyền truy cập...</p>}
   {authorized&&<>
    <nav aria-label="Điều hướng AI Lesson Studio" className="flex flex-wrap gap-2">
     {([["overview","Tổng quan",FolderOpen],["sources","Kho tài liệu",FileText],["setup","Thiết lập bài dạy",BookOpen]] as const).map(([id,label,Icon])=><button key={id} type="button" onClick={()=>setTab(id)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${tab===id?"bg-cyan-700 text-white":"bg-[#12365b] text-slate-200"}`}><Icon size={16}/>{label}</button>)}
    </nav>
    {error&&<div role="alert" className="rounded-xl border border-red-700 bg-red-950/50 p-3 text-red-200">{error}</div>}
    {message&&<div role="status" className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-3 text-emerald-200">{message}</div>}
    {tab==="overview"&&(!loaded?<div role="status" className="rounded-xl border border-amber-600/50 p-5 text-amber-100">Chưa tải được danh sách giáo án và tài liệu từ Cloud. Dữ liệu chưa được xác minh. Hãy xử lý thông báo kết nối phía trên rồi tải lại trang.</div>:<section className="space-y-4">
     <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <div className="rounded-xl bg-[#12365b] p-4"><p className="text-xs text-slate-400">Tổng giáo án</p><p className="text-3xl font-black">{lessons.length}</p></div>
      <div className="rounded-xl bg-[#12365b] p-4"><p className="text-xs text-slate-400">Bản nháp</p><p className="text-3xl font-black">{lessons.filter(l=>l.status==="DRAFT").length}</p></div>
      <div className="rounded-xl bg-[#12365b] p-4"><p className="text-xs text-slate-400">Tài liệu nguồn</p><p className="text-3xl font-black">{sources.length}</p></div>
     </div>
     {!lessons.length?<div className="rounded-xl border border-dashed border-blue-600 p-8 text-center text-slate-300">Chưa có giáo án. Chọn “Tạo bài dạy” để bắt đầu.</div>:lessons.map(l=><article key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-800 bg-[#0c2a4d] p-4">
      <div><h2 className="font-bold">{l.title}</h2><p className="text-xs text-slate-400">{l.subject||"Chưa chọn môn"} · Lớp {l.grade||"—"} · {l.periods} tiết · Bản nháp</p></div>
      <div className="flex gap-2"><button disabled={busy} onClick={()=>edit(l)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm">Mở / sửa</button><button aria-label={"Xóa "+l.title} disabled={busy} onClick={()=>remove(l.id)} className="rounded-lg border border-red-800 p-2 text-red-300"><Trash2 size={17}/></button></div>
     </article>)}
    </section>)}
    {tab==="sources"&&<section className="space-y-4">
      <div className="rounded-xl border border-dashed border-blue-500 bg-[#0c2a4d] p-6 text-center">
       <UploadCloud className="mx-auto mb-2 text-cyan-300" size={32}/><h2 className="font-bold">Thêm tài liệu nguồn</h2>
       <p className="mb-3 text-sm text-slate-400">PDF, DOCX, TXT · Tối đa 5 MB/tệp · Lưu riêng theo tài khoản</p>
       <input aria-label="Chọn tài liệu nguồn" type="file" accept=".pdf,.docx,.txt" disabled={busy} onChange={e=>{upload(e.target.files?.[0]??null);e.target.value="";}} className="max-w-full text-xs"/>
      </div>
      <p className="text-xs text-amber-200">V13.0A chỉ lưu tài liệu riêng tư, chưa trích xuất, đọc nội dung hay đưa lên AI.</p>
      {sources.length===0?<p className="text-slate-400">Chưa có tài liệu.</p>:sources.map(s=><div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#12365b] p-4">
       <div className="min-w-0"><p className="truncate text-sm font-medium">{s.filename}</p><p className="text-xs text-slate-400">{(s.sizeBytes/1024).toFixed(1)} KB · Đã lưu</p></div>
       <button disabled={busy} onClick={()=>deleteSource(s.id)} aria-label={"Xóa "+s.filename} className="rounded-lg p-2 text-red-300"><Trash2 size={17}/></button></div>)}
    </section>}
    {tab==="setup"&&<section className="max-w-3xl space-y-4 rounded-2xl border border-blue-800 bg-[#0c2a4d] p-5">
     <h2 className="text-xl font-bold">{editing?"Chỉnh sửa thông tin bài dạy":"Tạo bài dạy mới"}</h2>
     <div className="grid gap-4 sm:grid-cols-2">
      {([["title","Tên bài dạy *"],["subject","Môn học"],["grade","Lớp"],["textbook","Bộ sách / tài liệu"]] as const).map(([key,label])=><label key={key} className="space-y-1 text-sm"><span>{label}</span><input value={draft[key]} maxLength={key==="title"?200:150} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} className="w-full rounded-lg border border-blue-700 bg-[#061d38] p-3 outline-offset-2" /></label>)}
      <label className="space-y-1 text-sm"><span>Số tiết</span><input type="number" min={1} max={30} value={draft.periods} onChange={e=>setDraft(d=>({...d,periods:Number(e.target.value)}))} className="w-full rounded-lg border border-blue-700 bg-[#061d38] p-3"/></label>
     </div>
     <label className="block space-y-1 text-sm"><span>Yêu cầu cần đạt / ghi chú</span><textarea rows={5} maxLength={15000} value={draft.objectives} onChange={e=>setDraft(d=>({...d,objectives:e.target.value}))} className="w-full rounded-lg border border-blue-700 bg-[#061d38] p-3"/></label>
     <p className="text-xs text-slate-400">Soạn bằng AI và nhập NotebookLM sẽ được mở trong các phiên bản tiếp theo.</p>
     <div className="flex gap-2"><button disabled={busy||!draft.title.trim()} onClick={save} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-bold disabled:opacity-40"><Save size={17}/> Lưu Cloud</button><button onClick={()=>setTab("overview")} className="rounded-lg border border-blue-700 px-4 py-3">Hủy</button></div>
    </section>}
   </>}
  </div>
 </main>;
}
