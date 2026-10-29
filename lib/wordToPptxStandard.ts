import pptxgen from "pptxgenjs";
import type {SlideContent} from "./wordToPptx";

export async function createStandardPptx(slides:SlideContent[]):Promise<Blob>{
 if(!slides.length)throw Error("Không có slide để xuất.");
 if(slides.length>80)throw Error("Bản thử nghiệm hỗ trợ tối đa 80 slide.");
 const pptx=new pptxgen();
 pptx.layout="LAYOUT_WIDE";
 pptx.author="VLearning Studio";
 pptx.subject="Bài giảng PowerPoint có thể chỉnh sửa";
 pptx.title=slides[0]?.title||"Bài giảng";
 pptx.theme={headFontFace:"Aptos Display",bodyFontFace:"Aptos"};
 for(let i=0;i<slides.length;i++){
  const data=slides[i],slide=pptx.addSlide();
  slide.background={color:"FFFFFF"};
  slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:1.36,line:{color:"123B68",transparency:100},fill:{color:"123B68"}});
  slide.addText(data.title||"Nội dung bài học",{x:0.5,y:0.24,w:12.25,h:0.84,fontFace:"Aptos Display",fontSize:data.title.length>72?23:30,color:"FFFFFF",bold:true,breakLine:false,margin:0.08,valign:"middle",fit:"shrink"});
  const items=data.bullets.filter(x=>x.trim()).slice(0,6);
  if(items.length){
   const height=5.35/items.length;
   items.forEach((s,j)=>{
    slide.addText("• "+s,{x:0.85,y:1.69+j*height,w:11.75,h:Math.max(0.55,height-0.10),fontFace:"Aptos",fontSize:items.length>4?19:23,color:"21314C",margin:0.06,valign:"middle",breakLine:false,fit:"shrink"});
   });
  }
  slide.addText("VLearning Studio",{x:0.55,y:7.16,w:3.5,h:0.18,fontFace:"Aptos",fontSize:8,color:"64748B",margin:0});
  slide.addText(String(i+1)+"/"+slides.length,{x:11.9,y:7.16,w:0.85,h:0.18,fontFace:"Aptos",fontSize:8,color:"64748B",align:"right",margin:0});
 }
 const result=await pptx.write({outputType:"blob"});
 if(!(result instanceof Blob)||result.size<1000)throw Error("Tệp PowerPoint chưa được tạo đúng.");
 return result;
}
