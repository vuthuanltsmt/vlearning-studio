import pptxgen from "pptxgenjs";
import type {SlideContent} from "./wordToPptx";
import type {Stage} from "./lessonSlidePlanner";

export type DesignPreset="ocean"|"forest"|"sunrise";
export type SlideLayout="auto"|"cards"|"two-column"|"timeline"|"focus";
export type DesignedSlide=SlideContent&{stage?:Stage;layout?:SlideLayout};
const palettes:Record<DesignPreset,{primary:string;accent:string;soft:string;text:string}>={
 ocean:{primary:"123B68",accent:"0D9FB8",soft:"E8F5FB",text:"203552"},
 forest:{primary:"185344",accent:"2EA583",soft:"EAF7F0",text:"183F35"},
 sunrise:{primary:"703F65",accent:"DB8B47",soft:"FFF3E7",text:"422F46"}
};
export async function createStandardPptx(slides:DesignedSlide[],preset:DesignPreset="ocean"):Promise<Blob>{
 if(!slides.length||slides.length>80)throw Error("Chỉ hỗ trợ 1–80 slide.");
 const pptx=new pptxgen();pptx.layout="LAYOUT_WIDE";pptx.author="VLearning Studio";
 pptx.subject="Bài giảng PowerPoint có thể chỉnh sửa";pptx.title=slides[0].title||"Bài giảng";
 pptx.theme={headFontFace:"Arial",bodyFontFace:"Arial"};
 const c=palettes[preset],W=13.333,H=7.5;
 const text=(slide:ReturnType<typeof pptx.addSlide>,value:string,x:number,y:number,w:number,h:number,size:number,bold=false,color=c.text,align:"left"|"center"="left")=>
  slide.addText(value,{x,y,w,h,fontFace:"Arial",fontSize:size,bold,color,margin:0.06,breakLine:false,fit:"shrink",valign:"middle",align});
 const box=(slide:ReturnType<typeof pptx.addSlide>,x:number,y:number,w:number,h:number,fill:string)=>slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.16,line:{color:fill,transparency:100},fill:{color:fill}});
 slides.forEach((data,i)=>{
  const slide=pptx.addSlide();slide.background={color:"FFFFFF"};
  const bullets=data.bullets.filter(s=>s.trim()).slice(0,6);
  const stage=data.stage||"task";
  const mode:SlideLayout=data.layout&&data.layout!=="auto"?data.layout:stage==="cover"?"focus":stage==="roadmap"||stage==="summary"?"timeline":stage==="conclusion"||stage==="goals"?"cards":stage==="warmup"||stage==="task"?"two-column":"cards";
  if(stage==="cover"){
   slide.background={color:c.primary};box(slide,0.65,0.7,0.13,5.9,c.accent);
   text(slide,"VLEARNING · BÀI GIẢNG",1.1,1.15,10,0.45,19,true,"C5EAF2");
   text(slide,data.title,1.05,2.0,11.2,2.15,40,true,"FFFFFF");
   text(slide,"KHÁM PHÁ  •  THẢO LUẬN  •  VẬN DỤNG",1.1,5.55,10,0.45,15,false,"DFECF2");
  }else{
   slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:W,h:1.2,line:{color:c.primary,transparency:100},fill:{color:c.primary}});
   text(slide,data.title||"Nội dung bài học",0.58,0.2,12.1,0.72,data.title.length>72?23:31,true,"FFFFFF");
   text(slide,stage.toUpperCase(),0.62,1.39,11.5,0.32,12,true,c.accent);
   if(mode==="two-column"){
    box(slide,0.55,1.95,5.2,4.65,c.soft);
    text(slide,stage==="warmup"?"QUAN SÁT – DỰ ĐOÁN":"HỌC LIỆU / TÌNH HUỐNG",0.85,2.35,4.6,0.6,21,true,c.primary);
    text(slide,"Vùng học liệu trực quan\n(Bổ sung hình ảnh / bản đồ từ nguồn)",0.85,3.28,4.55,1.25,19,false,c.text);
    box(slide,6.0,1.95,6.75,4.65,"F3F6FA");
    text(slide,"NHIỆM VỤ HỌC TẬP",6.32,2.2,6.1,0.44,17,true,c.primary);
    bullets.slice(0,4).forEach((b,j)=>text(slide,String(j+1)+". "+b,6.3,2.83+j*0.84,6.03,0.73,19,false,c.text));
   }else if(mode==="timeline"){
    bullets.slice(0,5).forEach((b,j)=>{
     const y=1.95+j*0.84;box(slide,0.75,y,11.8,0.68,j%2?c.soft:"F3F6FA");
     box(slide,0.89,y+0.14,0.45,0.4,c.accent);
     text(slide,String(j+1),0.93,y+0.15,0.36,0.29,13,true,"FFFFFF","center");
     text(slide,b,1.55,y+0.07,10.55,0.55,21,false,c.text);
    });
   }else if(mode==="focus"){
    box(slide,0.8,2.05,11.7,3.7,c.soft);
    text(slide,bullets[0]||data.title,1.35,2.45,10.7,2.1,35,true,c.primary,"center");
   }else{
    const count=Math.min(6,bullets.length);const cols=count<=3?count||1:3;const rows=Math.ceil(count/cols);const gap=0.24;
    const width=(11.9-gap*(cols-1))/cols;const height=Math.min(2.25,(4.7-gap*(rows-1))/rows);
    bullets.slice(0,6).forEach((b,j)=>{const col=j%cols,row=Math.floor(j/cols);const x=0.72+col*(width+gap),y=2.05+row*(height+gap);box(slide,x,y,width,height,c.soft);box(slide,x+0.18,y+0.2,0.09,0.54,c.accent);text(slide,b,x+0.38,y+0.25,width-0.58,height-0.48,count>4?18:21,true,c.text);});
   }
  }
  text(slide,"VLearning Studio",0.62,7.15,4,0.19,9,false,stage==="cover"?"FFFFFF":"64748B");
  text(slide,String(i+1)+" / "+slides.length,11.8,7.15,0.85,0.19,9,false,stage==="cover"?"FFFFFF":"64748B","center");
 });
 const blob=await pptx.write({outputType:"blob"});
 if(!(blob instanceof Blob)||blob.size<1000)throw Error("Không tạo được PowerPoint.");
 return blob;
}
