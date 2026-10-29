import JSZip from "jszip";

export type SlideContent={title:string;bullets:string[]};
const escapeXml=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const tag=(name:string,attrs:string,body:string)=>"<"+name+(attrs?" "+attrs:"")+">"+body+"</"+name+">";
export async function readDocx(file:File):Promise<SlideContent[]>{
 if(file.size>10*1024*1024)throw Error("Word vượt quá 10 MB.");
 const zip=await JSZip.loadAsync(await file.arrayBuffer());
 const doc=zip.file("word/document.xml");
 if(!doc)throw Error("Tệp không phải Word .docx hợp lệ.");
 const xml=new DOMParser().parseFromString(await doc.async("string"),"application/xml");
 if(xml.querySelector("parsererror"))throw Error("Không đọc được cấu trúc Word.");
 const paragraphs=Array.from(xml.getElementsByTagName("w:p"));
 const slides:SlideContent[]=[];
 let slide:SlideContent={title:file.name.replace(/\.docx$/i,""),bullets:[]};
 function flush(){if(slide.bullets.length||!slides.length)slides.push(slide);}
 for(const p of paragraphs){
  const text=Array.from(p.getElementsByTagName("w:t")).map(x=>x.textContent||"").join("").trim();
  if(!text)continue;
  const style=p.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val")||"";
  const heading=/^heading[1-6]$/i.test(style)||/^(?:[IVX]+\.\s|(?:HOẠT ĐỘNG|Hoạt động)\s+\d|BÀI\s+\d)/i.test(text)||/^[A-ZÀ-Ỹ\d\s:–-]{9,}$/.test(text);
  if(heading){
   if(slide.bullets.length)flush();
   slide={title:text.slice(0,115),bullets:[]};
  }else{
   if(slide.bullets.length>=6){flush();slide={title:slide.title+" (tiếp)",bullets:[]};}
   const chunks=text.match(/.{1,220}(?:\s|$)/g)||[text.slice(0,220)];
   slide.bullets.push(...chunks.map(x=>x.trim()).filter(Boolean));
  }
 }
 if(slide.bullets.length)flush();
 return slides.filter(s=>s.title||s.bullets.length).slice(0,80);
}
function shape(id:number,name:string,text:string,x:number,y:number,w:number,h:number,fontSize:number,isTitle:boolean){
 const paras=text.split("\n").map(line=>'<a:p><a:pPr algn="l"/><a:r><a:rPr lang="vi-VN" sz="'+fontSize+'" b="'+(isTitle?1:0)+'"><a:solidFill><a:srgbClr val="'+(isTitle?"FFFFFF":"1B2B47")+'"/></a:solidFill></a:rPr><a:t>'+escapeXml(line)+'</a:t></a:r><a:endParaRPr lang="vi-VN"/></a:p>').join("");
 return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="'+escapeXml(name)+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+w+'" cy="'+h+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="130000" tIns="70000" rIns="130000" bIns="70000" anchor="t"/><a:lstStyle/>'+paras+'</p:txBody></p:sp>';
}
export async function createPptx(slides:SlideContent[]):Promise<Blob>{
 if(!slides.length)throw Error("Không tìm thấy nội dung để tạo slide.");
 const z=new JSZip(),nsP="http://schemas.openxmlformats.org/presentationml/2006/main",nsA="http://schemas.openxmlformats.org/drawingml/2006/main",nsR="http://schemas.openxmlformats.org/officeDocument/2006/relationships";
 const header='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
 const ct=['<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>','<Default Extension="xml" ContentType="application/xml"/>','<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>','<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>','<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>','<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'];
 for(let i=0;i<slides.length;i++){
  const {title,bullets}=slides[i];
  ct.push('<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>');
  const bulletText=bullets.map(b=>"•  "+b).join("\n");
  const slide='<p:sld xmlns:p="'+nsP+'" xmlns:a="'+nsA+'" xmlns:r="'+nsR+'"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Header background"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="1250000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="123B68"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>'+shape(3,"Title",title,500000,185000,11200000,860000,title.length>70?2300:3000,true)+shape(4,"Content",bulletText,650000,1580000,10850000,4750000,bullets.length>4?1750:2200,false)+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  z.file("ppt/slides/slide"+(i+1)+".xml",header+slide);
  z.file("ppt/slides/_rels/slide"+(i+1)+".xml.rels",header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+nsR+'/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>');
 }
 z.file("[Content_Types].xml",header+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+ct.join("")+'</Types>');
 z.file("_rels/.rels",header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+nsR+'/officeDocument" Target="ppt/presentation.xml"/></Relationships>');
 z.file("ppt/presentation.xml",header+'<p:presentation xmlns:p="'+nsP+'" xmlns:a="'+nsA+'" xmlns:r="'+nsR+'"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>'+slides.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(i+2)+'"/>').join("")+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>');
 z.file("ppt/_rels/presentation.xml.rels",header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+nsR+'/slideMaster" Target="slideMasters/slideMaster1.xml"/>'+slides.map((_,i)=>'<Relationship Id="rId'+(i+2)+'" Type="'+nsR+'/slide" Target="slides/slide'+(i+1)+'.xml"/>').join("")+'</Relationships>');
 z.file("ppt/slideMasters/slideMaster1.xml",header+'<p:sldMaster xmlns:p="'+nsP+'" xmlns:a="'+nsA+'" xmlns:r="'+nsR+'"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap accent1="4F81BD" accent2="C0504D" accent3="9BBB59" accent4="8064A2" accent5="4BACC6" accent6="F79646" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>');
 z.file("ppt/slideMasters/_rels/slideMaster1.xml.rels",header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+nsR+'/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="'+nsR+'/theme" Target="../theme/theme1.xml"/></Relationships>');
 z.file("ppt/slideLayouts/slideLayout1.xml",header+'<p:sldLayout xmlns:p="'+nsP+'" xmlns:a="'+nsA+'" xmlns:r="'+nsR+'" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>');
 z.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels",header+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+nsR+'/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>');
 const colors=["4472C4","ED7D31","A5A5A5","FFC000","5B9BD5","70AD47"];
 const fill=(color:string)=>'<a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill>';
 const ln=(width:number,color:string)=>'<a:ln w="'+width+'">'+fill(color)+'<a:prstDash val="solid"/></a:ln>';
 const theme='<a:theme xmlns:a="'+nsA+'" name="VLearning"><a:themeElements><a:clrScheme name="VLearning">'+
 '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>'+
 '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'+
 '<a:dk2><a:srgbClr val="123B68"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>'+
 ["accent1","accent2","accent3","accent4","accent5","accent6"].map((n,i)=>'<a:'+n+'><a:srgbClr val="'+colors[i]+'"/></a:'+n+'>').join("")+
 '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'+
 '<a:fontScheme name="VLearning"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'+
 '<a:fmtScheme name="VLearning"><a:fillStyleLst>'+fill("4472C4")+fill("FFFFFF")+fill("123B68")+'</a:fillStyleLst>'+
 '<a:lnStyleLst>'+ln(9525,"4472C4")+ln(12700,"4472C4")+ln(19050,"4472C4")+'</a:lnStyleLst>'+
 '<a:effectStyleLst>'+[0,1,2].map(()=>'<a:effectStyle><a:effectLst/></a:effectStyle>').join("")+'</a:effectStyleLst>'+
 '<a:bgFillStyleLst>'+fill("FFFFFF")+fill("E7E6E6")+fill("123B68")+'</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>';
 z.file("ppt/theme/theme1.xml",header+theme);

 const bytes=await z.generateAsync({type:"blob",compression:"DEFLATE"});
 // Verify that the generated OPC package has readable XML parts and all slides.
 const check=await JSZip.loadAsync(await bytes.arrayBuffer());
 for(const required of ["[Content_Types].xml","_rels/.rels","ppt/presentation.xml","ppt/slideMasters/slideMaster1.xml","ppt/slideLayouts/slideLayout1.xml","ppt/theme/theme1.xml",...slides.map((_,i)=>"ppt/slides/slide"+(i+1)+".xml")]){
  const part=check.file(required);
  if(!part)throw Error("PPTX thiếu thành phần "+required);
  const parsed=new DOMParser().parseFromString(await part.async("string"),"application/xml");
  if(parsed.getElementsByTagName("parsererror").length)throw Error("Cấu trúc XML lỗi: "+required);
 }
 return bytes;
}
