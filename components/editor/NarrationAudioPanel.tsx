"use client";
import {useEffect,useRef,useState} from "react";
import type {LessonPage} from "@/types/lesson";

const DB="vlearning-voice-narration-v1", STORE="audio";
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function save(id:string,blob:Blob|null){const db=await openDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");if(blob)tx.objectStore(STORE).put(blob,id);else tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
async function load(id:string):Promise<Blob|null>{const db=await openDb();try{return await new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result instanceof Blob?r.result:null);r.onerror=()=>reject(r.error)})}finally{db.close()}}
export function NarrationAudioPanel({page,currentTime,isPlaying,quizActive,videoTime}:{page:LessonPage;currentTime:number;isPlaying:boolean;quizActive:boolean;videoTime:boolean}){
 const [url,setUrl]=useState<string|null>(null),[recording,setRecording]=useState(false),[enabled,setEnabled]=useState(true),[volume,setVolume]=useState(80),[error,setError]=useState("");
 const [storageStatus,setStorageStatus]=useState("Đang kiểm tra bản ghi...");
 const [playbackStatus,setPlaybackStatus]=useState("");
 const audio=useRef<HTMLAudioElement|null>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]);
 useEffect(()=>{let alive=true;let objectUrl:string|null=null;setUrl(null);setError("");setStorageStatus("Đang kiểm tra bản ghi...");void load(page.id).then(blob=>{if(!alive)return;if(blob){objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);setStorageStatus("Đã khôi phục bản ghi âm trên thiết bị này")}else{setStorageStatus("Chưa lưu bản ghi âm cho trang này")}}).catch(()=>{if(alive){setStorageStatus("Không đọc được dữ liệu");setError("Không đọc được bản ghi âm trên thiết bị này.")}});return ()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[page.id]);
 useEffect(()=>{const a=audio.current;if(!a)return;a.volume=volume/100;if(!enabled||quizActive){a.pause();return}if(videoTime){const start=page.narrationStart??0;if(currentTime<start){a.pause();a.currentTime=0;return}const target=Math.max(0,currentTime-start);if(Number.isFinite(a.duration)&&target>=a.duration){a.pause();return}if(Math.abs(a.currentTime-target)>.45)a.currentTime=target;if(isPlaying && a.paused)void a.play().then(()=>setPlaybackStatus("Đang phát thuyết minh theo video")).catch(()=>setPlaybackStatus("Trình duyệt chặn tự phát tiếng. Hãy nhấn Play trên thanh âm thanh."));else if(!isPlaying && !a.paused){a.pause();setPlaybackStatus("Đã tạm dừng theo video")}}},[url,currentTime,isPlaying,quizActive,enabled,volume,videoTime,page.narrationStart]);
 useEffect(()=>()=>{recorder.current?.state==="recording"&&recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop())},[]);
 async function store(blob:Blob){try{await save(page.id,blob);const old=url;const next=URL.createObjectURL(blob);setUrl(next);if(old)URL.revokeObjectURL(old);setStorageStatus("Đã lưu bản ghi âm trên thiết bị này");setError("")}catch{setError("Không lưu được âm thanh. Hãy kiểm tra dung lượng bộ nhớ trình duyệt.")}}
 async function record(){if(recording){recorder.current?.stop();setRecording(false);return}try{const s=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=s;chunks.current=[];const m=new MediaRecorder(s);recorder.current=m;m.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};m.onstop=()=>{const blob=new Blob(chunks.current,{type:m.mimeType||"audio/webm"});s.getTracks().forEach(t=>t.stop());stream.current=null;if(blob.size)void store(blob)};m.start();setRecording(true);setError("")}catch{setError("Không truy cập được micro. Cần cấp quyền micro và mở trang qua HTTPS.")}}
 async function upload(f:File){if(!f.type.startsWith("audio/")&&!/\.(mp3|wav|m4a|webm|ogg)$/i.test(f.name)){setError("Chỉ nhận file âm thanh MP3, WAV, M4A, WebM hoặc OGG.");return}if(f.size>30*1024*1024){setError("Tệp vượt 30 MB.");return}await store(f)}
 function download(){if(!url)return;const a=document.createElement("a");a.href=url;a.download="Loi_giang_"+page.id+".webm";a.click()}
 async function remove(){audio.current?.pause();await save(page.id,null);if(url)URL.revokeObjectURL(url);setUrl(null);setStorageStatus("Đã xóa bản ghi âm của trang này")}
 return <section className="border-b border-blue-900 p-5 text-white" aria-label="Thuyết minh bằng giọng nói">
 <h3 className="mb-2 font-bold text-cyan-100">02 · THUYẾT MINH BẰNG GIỌNG NÓI</h3>
 <p className="mb-3 text-xs leading-5 text-blue-100">Ghi âm hoặc tải âm thanh cho trang hiện tại. Tệp lưu trong trình duyệt trên thiết bị này, không tự đồng bộ lên Cloud hoặc xuất SCORM.</p>
 <p role="status" className="mb-3 text-xs text-cyan-200">{storageStatus}</p>
 <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>void record()} className={"rounded-lg px-3 py-2 text-sm font-semibold "+(recording?"bg-rose-600":"bg-cyan-600")}>{recording?"■ Dừng ghi âm":"● Ghi âm micro"}</button>
 <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold">Tải MP3/WAV/M4A<input type="file" accept="audio/*,.mp3,.wav,.m4a" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value=""}}/></label></div>
 {url&&<div className="mt-3 space-y-3"><audio ref={audio} src={url} controls preload="metadata" className="w-full" />
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Bật giọng thuyết minh</label>
 <label className="block text-xs">Âm lượng {volume}%<input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(Number(e.target.value))} className="w-full"/></label>
 <div className="flex flex-wrap gap-4"><button type="button" onClick={download} className="text-xs font-semibold text-cyan-200 underline">Tải bản ghi về máy (sao lưu)</button><button type="button" onClick={()=>void remove()} className="text-xs font-semibold text-rose-200 underline">Xóa bản ghi âm</button></div></div>}
 {playbackStatus&&url&&<p role="status" className="mt-2 text-xs text-blue-100">{playbackStatus}</p>}
 {error&&<p role="alert" className="mt-2 text-xs text-rose-200">{error}</p>}
 <p className="mt-2 text-xs text-blue-200">Khi phát video, giọng đọc đồng bộ theo thời gian bắt đầu lời giảng; khi tạm dừng hoặc có Quiz thì âm thanh dừng. Với trang slide tĩnh, sử dụng nút phát trong trình nghe âm thanh.</p>
 </section>
}
