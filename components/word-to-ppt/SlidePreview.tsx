"use client";
import type {DesignedSlide,DesignPreset,SlideLayout} from "@/lib/wordToPptxStandard";
const schemes={ocean:{primary:"#123B68",accent:"#0D9FB8",soft:"#E8F5FB",text:"#203552"},forest:{primary:"#185344",accent:"#2EA583",soft:"#EAF7F0",text:"#183F35"},sunrise:{primary:"#703F65",accent:"#DB8B47",soft:"#FFF3E7",text:"#422F46"}};
export function resolveLayout(stage:DesignedSlide["stage"],layout?:SlideLayout):Exclude<SlideLayout,"auto">{
 if(layout&&layout!=="auto")return layout;
 if(stage==="cover")return "focus";
 if(stage==="roadmap"||stage==="summary")return "timeline";
 if(stage==="conclusion"||stage==="goals")return "cards";
 if(stage==="warmup"||stage==="task")return "two-column";
 return "cards";
}
export function SlidePreview({slide,preset,layout,index,total}:{slide:DesignedSlide;preset:DesignPreset;layout?:SlideLayout;index:number;total:number}){
 const c=schemes[preset],mode=resolveLayout(slide.stage,layout),bullets=slide.bullets.filter(x=>x.trim()).slice(0,6);
 return <div className="relative aspect-video overflow-hidden rounded-xl bg-white shadow-xl" style={{color:c.text}}>
  {slide.stage==="cover"?<div className="absolute inset-0 flex flex-col justify-center px-[9%]" style={{background:c.primary,color:"#fff"}}>
    <div className="absolute left-[6%] top-[12%] h-[76%] w-[1%]" style={{background:c.accent}}/>
    <p className="mb-[6%] text-[clamp(8px,1.2vw,16px)] font-semibold tracking-widest">VLEARNING · BÀI GIẢNG</p>
    <h3 className="line-clamp-3 text-[clamp(18px,3vw,40px)] font-black leading-tight">{slide.title}</h3>
    <p className="mt-[7%] text-[clamp(8px,1.2vw,15px)]">KHÁM PHÁ · THẢO LUẬN · VẬN DỤNG</p>
   </div>:<>
   <div className="flex h-[17%] items-center px-[4.5%]" style={{background:c.primary,color:"#fff"}}><h3 className="line-clamp-2 text-[clamp(12px,2vw,28px)] font-bold">{slide.title}</h3></div>
   <div className="px-[5%] pt-[2%] text-[clamp(9px,1vw,13px)] font-bold uppercase" style={{color:c.accent}}>{slide.stage||"task"}</div>
   {mode==="two-column"?<div className="absolute inset-x-[5%] bottom-[12%] top-[31%] grid grid-cols-[44%_1fr] gap-[2%]">
    <div className="rounded-lg p-[7%]" style={{background:c.soft}}><strong className="text-[clamp(10px,1.6vw,20px)]">HỌC LIỆU / TÌNH HUỐNG</strong><p className="mt-[8%] text-[clamp(9px,1.1vw,15px)]">Bổ sung hình ảnh, bản đồ hoặc học liệu từ nguồn</p></div>
    <div className="rounded-lg bg-slate-100 p-[6%]"><strong className="text-[clamp(10px,1.4vw,18px)]">NHIỆM VỤ HỌC TẬP</strong>{bullets.slice(0,4).map((x,i)=><p key={i} className="mt-[5%] line-clamp-2 text-[clamp(9px,1.15vw,16px)]">{i+1}. {x}</p>)}</div>
   </div>:mode==="timeline"?<div className="absolute inset-x-[6%] bottom-[11%] top-[29%] flex flex-col gap-[2%]">{bullets.slice(0,5).map((x,i)=><div key={i} className="flex min-h-0 flex-1 items-center gap-3 rounded-lg px-[3%]" style={{background:i%2?c.soft:"#F3F6FA"}}><b className="rounded px-2 py-1 text-white" style={{background:c.accent}}>{i+1}</b><p className="line-clamp-2 text-[clamp(9px,1.4vw,18px)]">{x}</p></div>)}</div>:mode==="focus"?<div className="absolute inset-x-[6%] bottom-[16%] top-[32%] flex items-center justify-center rounded-xl px-[5%] text-center" style={{background:c.soft}}><strong className="line-clamp-4 text-[clamp(15px,2.4vw,32px)]">{bullets[0]||slide.title}</strong></div>:<div className="absolute inset-x-[5%] bottom-[13%] top-[31%] grid gap-[2%]" style={{gridTemplateColumns:`repeat(${bullets.length<=3?Math.max(1,bullets.length):3},minmax(0,1fr))`}}>{bullets.map((x,i)=><div key={i} className="flex items-center rounded-lg border-l-4 p-[6%]" style={{background:c.soft,borderColor:c.accent}}><p className="line-clamp-5 text-[clamp(10px,1.5vw,20px)] font-semibold">{x}</p></div>)}</div>}
  </>}
  <div className="absolute bottom-[2%] left-[5%] right-[5%] flex justify-between text-[clamp(7px,.8vw,11px)]" style={{color:slide.stage==="cover"?"#fff":"#64748B"}}><span>VLearning Studio</span><span>{index+1} / {total}</span></div>
 </div>;
}
