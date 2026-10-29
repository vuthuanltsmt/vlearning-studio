import JSZip from "jszip";
export type LessonSection={heading:string;content:string};
const esc=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const run=(s:string,bold=false)=>"<w:r>"+(bold?"<w:rPr><w:b/></w:rPr>":"")+"<w:t xml:space=\"preserve\">"+esc(s)+"</w:t></w:r>";
function para(value:string,kind:"title"|"main"|"sub"|"bullet"="bullet"){
 const main=kind==="main",sub=kind==="sub",bullet=kind==="bullet";
 const size=kind==="title"?32:main?28:sub?25:24;
 const props='<w:pPr><w:spacing w:before="'+(main?230:sub?130:0)+'" w:after="100" w:line="340" w:lineRule="auto"/>'+(bullet?'<w:ind w:left="720" w:hanging="320"/><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs>':'')+'</w:pPr>';
 const text=bullet?"•\t"+value:value;
 return "<w:p>"+props+"<w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\"/><w:sz w:val=\""+size+"\"/>"+(bullet?"":"<w:b/>")+"</w:rPr><w:t xml:space=\"preserve\">"+esc(text)+"</w:t></w:r></w:p>";
}
export async function lessonDocx(title:string,sections:LessonSection[]){
 const z=new JSZip();
 z.file("[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 z.folder("_rels")!.file(".rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 const paragraphs=[para("KẾ HOẠCH BÀI DẠY","title"),para(title,"sub")];
 for(const s of sections){
  const heading=s.heading.trim();
  const kind=/^(?:I|II|III|IV|V|VI)\.\s|^HOẠT ĐỘNG 2:|^BẢNG ĐÁNH GIÁ/.test(heading)?"main":"sub";
  paragraphs.push(para(heading,kind));
  for(const line of s.content.split(/\r?\n/)){
   const value=line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/,"").trim();
   if(value)paragraphs.push(para(value,"bullet"));
  }
 }
 const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+paragraphs.join("")+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1200" w:right="1200" w:bottom="1200" w:left="1200"/></w:sectPr></w:body></w:document>';
 z.folder("word")!.file("document.xml",xml);
 return z.generateAsync({type:"uint8array",compression:"DEFLATE"});
}
