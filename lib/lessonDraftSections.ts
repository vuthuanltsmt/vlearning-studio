export type LessonPart={heading:string;content:string};
export const lessonHeadings=["I. Mục tiêu","II. Chuẩn bị","III. Khởi động","IV. Hình thành kiến thức","V. Luyện tập","VI. Vận dụng","VII. Đánh giá"];
const indexOfHeading=(line:string):number=>{
 const m=line.trim().match(/^(I|II|III|IV|V|VI|VII)[.\)\s]+(.+)$/i);
 if(!m)return -1;
 const roman=m[1].toUpperCase(),name=m[2].toLocaleLowerCase("vi").replace(/[:.\s]+$/,"").trim();
 const expected=["mục tiêu","chuẩn bị","khởi động","hình thành kiến thức","luyện tập","vận dụng","đánh giá"];
 const idx=["I","II","III","IV","V","VI","VII"].indexOf(roman);
 return idx>=0&&name===expected[idx]?idx:-1;
};
export function splitLessonDraft(text:string):LessonPart[]{
 const result=lessonHeadings.map(heading=>({heading,content:""}));
 const lines=text.replace(/\r\n/g,"\n").split("\n");let current=-1;const preamble:string[]=[];
 for(const line of lines){
  const next=indexOfHeading(line);
  if(next>=0){current=next;continue;}
  if(current<0)preamble.push(line);else result[current].content+=line+"\n";
 }
 const found=result.some(x=>x.content.trim());
 if(!found){result[3].content=text.trim();return result;}
 if(preamble.join("").trim())result[3].content=(preamble.join("\n").trim()+"\n\n"+result[3].content).trim();
 result.forEach(x=>x.content=x.content.trim());
 return result;
}
