"use client";
import {useEffect,useRef,useState} from "react";
import type {LessonPage} from "@/types/lesson";

const DB="vlearning-voice-narration-v1", STORE="audio";
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function save(id:string,blob:Blob|null){const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");if(blob)tx.objectStore(STORE).put(blob,id);else tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
async function load(id:string):Promise<Blob|null>{const db=await openDb();try{return await new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result instanceof Blob?r.result:null);r.onerror=()=>reject(r.error)})}finally{db.close()}}
export function NarrationAudioPanel({page,currentTime,isPlaying,quizActive,videoTime}:{page:LessonPage;currentTime:number;isPlaying:boolean;quizActive:boolean;videoTime:boolean}){
 const [url,setUrl]=useState<string|null>(null),[recording,setRecording]=useState(false),[volume,setVolume]=useState(80),[error,setError]=useState("");
 const [storageStatus,setStorageStatus]=useState("Đang kiểm tra bản ghi...");
 const [playbackStatus,setPlaybackStatus]=useState("");
 const [audioMime,setAudioMime]=useState("audio/webm");
 const audio=useRef<HTMLAudioElement|null>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]);
 useEffect(()=>{let alive=true;let objectUrl:string|null=null;setUrl(null);setError("");setStorageStatus("Đang kiểm tra bản ghi...");void load(page.id).then(blob=>{if(!alive)return;if(blob){setAudioMime(blob.type||"audio/webm");objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);setStorageStatus("Đã khôi phục bản ghi âm trên thiết bị này")}else{setStorageStatus("Chưa lưu bản ghi âm cho trang này")}}).catch(()=>{if(alive){setStorageStatus("Không đọc được dữ liệu");setError("Không đọc được bản ghi âm trên thiết bị này.")}});return ()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[page.id]);
 useEffect(()=>{const a=audio.current;if(!a)return;a.volume=volume/100;if(quizActive||!isPlaying){a.pause();return}if(videoTime){const start=page.narrationStart??0;if(currentTime<start){a.pause();a.currentTime=0;return}const target=Math.max(0,currentTime-start);if(Number.isFinite(a.duration)&&target>=a.duration){a.pause();return}if(Math.abs(a.currentTime-target)>.45)a.currentTime=target;if(isPlaying && a.paused)void a.play().then(()=>setPlaybackStatus("Đang phát thuyết minh theo video")).catch(()=>setPlaybackStatus("Hãy nhấn nút Play chung để bật cả video và âm thanh."));else if(!isPlaying && !a.paused){a.pause();setPlaybackStatus("Đã tạm dừng theo video")}}},[url,currentTime,isPlaying,quizActive,volume,videoTime,page.narrationStart]);
 useEffect(()=>()=>{recorder.current?.state==="recording"&&recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop())},[]);
 // Bind shared video controls to the microphone recorder.
 useEffect(()=>{
   let active=true;
   const onPlay=async(event:Event)=>{
     const respond=(event as CustomEvent<{ready?:(ok:boolean)=>void}>).detail?.ready;
     const signal=(ok:boolean)=>{respond?.(ok);};
     if(recorder.current?.state==="paused"){recorder.current.resume();setRecording(true);signal(true);return;}
     if(recorder.current?.state==="recording"){signal(true);return;}
     try {
       const mic=await navigator.mediaDevices.getUserMedia({audio:true});
       if(!active){mic.getTracks().forEach(t=>t.stop());signal(false);return;}
       const next=new MediaRecorder(mic);
       recorder.current=next;stream.current=mic;chunks.current=[];
       next.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
       next.onstop=()=>{
         const blob=new Blob(chunks.current,{type:next.mimeType||"audio/webm"});
         mic.getTracks().forEach(t=>t.stop());
         if(recorder.current===next)recorder.current=null;
         stream.current=null;setRecording(false);
         if(blob.size){void store(blob).finally(()=>window.dispatchEvent(new Event("vlearning:record-saved")));}else window.dispatchEvent(new Event("vlearning:record-saved"));
       };
       next.start(1000);setRecording(true);setError("");setStorageStatus("Đang ghi âm cùng video");signal(true);
     } catch {setError("Không thể ghi âm: hãy cấp quyền micro và nhấn Play lại.");signal(false);}
   };
   const onPause=()=>{if(recorder.current?.state==="recording"){recorder.current.pause();setRecording(false);setStorageStatus("Đã tạm dừng ghi âm");}};
   const onFinish=()=>{if(recorder.current && recorder.current.state!=="inactive")recorder.current.stop();else window.dispatchEvent(new Event("vlearning:record-saved"));};
   window.addEventListener("vlearning:record-play",onPlay);
   window.addEventListener("vlearning:record-pause",onPause);
   window.addEventListener("vlearning:record-finish",onFinish);
   return ()=>{active=false;window.removeEventListener("vlearning:record-play",onPlay);window.removeEventListener("vlearning:record-pause",onPause);window.removeEventListener("vlearning:record-finish",onFinish);onFinish();};
 },[page.id]);
 useEffect(()=>{if(quizActive||!isPlaying){if(recorder.current?.state==="recording"){recorder.current.pause();setRecording(false);}}},[quizActive,isPlaying]);
 async function store(blob:Blob){try{await save(page.id,blob);setAudioMime(blob.type||"audio/webm");const old=url;const next=URL.createObjectURL(blob);setUrl(next);if(old)URL.revokeObjectURL(old);setStorageStatus("Đã lưu bản ghi âm trên thiết bị này");setError("")}catch{setError("Không lưu được âm thanh. Hãy kiểm tra dung lượng bộ nhớ trình duyệt.")}}
 async function record(){if(recording){recorder.current?.stop();setRecording(false);return}try{const s=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=s;chunks.current=[];const m=new MediaRecorder(s);recorder.current=m;m.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};m.onstop=()=>{const blob=new Blob(chunks.current,{type:m.mimeType||"audio/webm"});s.getTracks().forEach(t=>t.stop());stream.current=null;if(blob.size)void store(blob)};m.start();setRecording(true);setError("")}catch{setError("Không truy cập được micro. Cần cấp quyền micro và mở trang qua HTTPS.")}}
 async function upload(f:File){if(!f.type.startsWith("audio/")&&!/\.(mp3|wav|m4a|webm|ogg)$/i.test(f.name)){setError("Chỉ nhận file âm thanh MP3, WAV, M4A, WebM hoặc OGG.");return}if(f.size>30*1024*1024){setError("Tệp vượt 30 MB.");return}await store(f)}
 function download(){if(!url)return;const a=document.createElement("a");a.href=url;const ext=audioMime.includes("mpeg")?"mp3":audioMime.includes("wav")?"wav":audioMime.includes("mp4")?"m4a":audioMime.includes("ogg")?"ogg":"webm";a.download="Loi_giang_"+page.id+"."+ext;a.click()}
 async function remove(){audio.current?.pause();await save(page.id,null);if(url)URL.revokeObjectURL(url);setUrl(null);setStorageStatus("Đã xóa bản ghi âm của trang này")}
 return <section className="flex min-h-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-white" aria-label="Trạng thái ghi âm thuyết trình">
 <span className="shrink-0 font-semibold">{recording?"🔴 Đang ghi âm":"🎙️ Ghi âm theo Play"}</span>
 <span role="status" className="max-w-[240px] truncate text-cyan-200">{storageStatus}</span>
 <button type="button" onClick={()=>window.dispatchEvent(new Event("vlearning:record-finish"))} className="shrink-0 rounded bg-cyan-700 px-2 py-1">Lưu ghi âm</button>
 <label className="shrink-0 cursor-pointer rounded bg-blue-700 px-2 py-1">Tải âm thanh<input type="file" accept="audio/*,.mp3,.wav,.m4a" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value=""}}/></label>
 {url&&<><audio ref={audio} src={url} preload="metadata"/><button type="button" onClick={download} className="shrink-0 underline">Tải bản ghi</button><button type="button" onClick={()=>void remove()} className="shrink-0 underline">Xóa</button></>}
 {error&&<span role="alert" className="max-w-[260px] truncate text-rose-300" title={error}>{error}</span>}
 </section>;
}
