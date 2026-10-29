export type LessonItem={heading:string;content:string};
const act=(name:string):LessonItem[]=>[{heading:name,content:""},{heading:"a. Mục tiêu",content:""},{heading:"b. Nội dung",content:""},{heading:"c. Sản phẩm",content:""},{heading:"d. Tổ chức thực hiện",content:""}];
export const blankLesson=():LessonItem[]=>[
 ...["I. MỤC TIÊU","1. Kiến thức","2. Năng lực","- Năng lực chung","- Năng lực đặc thù","- Năng lực số","3. Phẩm chất","II. THIẾT BỊ VÀ HỌC LIỆU","1. Giáo viên","2. Học sinh","III. TIẾN TRÌNH DẠY HỌC"].map(heading=>({heading,content:""})),
 ...act("Hoạt động 1 (Khởi động)"),{heading:"HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC",content:""},...act("Hoạt động 2.1. Nội dung 1"),...act("IV. HOẠT ĐỘNG LUYỆN TẬP"),...act("V. HOẠT ĐỘNG VẬN DỤNG"),{heading:"BẢNG ĐÁNH GIÁ VÀ CỤ THỂ HÓA NĂNG LỰC SỐ",content:""},{heading:"VI. PHỤ LỤC",content:""}
];
const normalize=(s:string)=>s.replace(/\*\*/g,"").replace(/^[\s#>*-]+/,"").trim();
const norm=(s:string)=>normalize(s).toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
export function parseLessonDraft(raw:string):LessonItem[]{
 const result=blankLesson();
 const src=raw.replace(/\r\n/g,"\n").split("\n");
 let section=-1,activity="",field=-1,found=0;
 const append=(line:string)=>{if(section>=0)result[section].content+=(result[section].content?"\n":"")+line;};
 const target=(name:string)=>result.findIndex(x=>x.heading===name);
 const ensureAct=(name:string)=>{
  const index=result.findIndex(x=>x.heading===name);
  if(index>=0)return index;
  const number=name.match(/^Hoạt động 2\.(\d+)\./)?.[1];
  const existing=number?result.findIndex(x=>new RegExp("^Hoạt động 2\\."+number+"\\.").test(x.heading)):-1;
  if(existing>=0){
   // Reuse the blank 2.x activity rather than creating a duplicate empty card.
   result[existing].heading=name;
   return existing;
  }
  const end=result.findIndex(x=>x.heading.startsWith("IV. HOẠT ĐỘNG"));
  result.splice(end,0,...act(name));return end;
 };
 for(const line of src){
  const s=normalize(line),n=norm(line);
  if(!s||/^(---+|___+)$/.test(s))continue;
  if(/ban nhap can giao vien kiem duyet|ban nhap ke hoach bai day da hoan thanh|luu y: giao vien can kiem tra lai/.test(n))continue;
  if(/^ke hoach bai day:|^duoi day la ke hoach bai day/.test(n))continue;
  if(/^i[.\s]+muc tieu/.test(n)&&!/^(ii|iii|iv)/.test(n)){section=target("I. MỤC TIÊU");found++;continue;}
  if(/^1[.)]\s*(ve\s*)?kien thuc/.test(n)){section=target("1. Kiến thức");found++;continue;}
  if(/^2[.)]\s*(ve\s*)?nang luc/.test(n)){section=target("2. Năng lực");found++;continue;}
  if(/^nang luc chung[:\s]/.test(n)){section=target("- Năng lực chung");found++;const rest=s.replace(/^năng lực chung\s*:\s*/i,"");if(rest!==s)append(rest);continue;}
  if(/^nang luc dac thu/.test(n)){section=target("- Năng lực đặc thù");found++;const pos=s.indexOf(":");if(pos>=0)append(s.slice(pos+1).trim());continue;}
  if(/^nang luc so[:\s]/.test(n)){section=target("- Năng lực số");found++;const pos=s.indexOf(":");if(pos>=0)append(s.slice(pos+1).trim());continue;}
  if(/^3[.)]\s*(ve\s*)?pham chat/.test(n)){section=target("3. Phẩm chất");found++;continue;}
  if(/^ii[.\s]+thiet bi/.test(n)){section=target("II. THIẾT BỊ VÀ HỌC LIỆU");found++;continue;}
  if(/^1[.)]\s*(doi voi\s*)?giao vien/.test(n)){section=target("1. Giáo viên");found++;const pos=s.indexOf(":");if(pos>=0)append(s.slice(pos+1).trim());continue;}
  if(/^2[.)]\s*(doi voi\s*)?hoc sinh/.test(n)){section=target("2. Học sinh");found++;const pos=s.indexOf(":");if(pos>=0)append(s.slice(pos+1).trim());continue;}
  if(/^iii[.\s]+tien trinh/.test(n)){section=target("III. TIẾN TRÌNH DẠY HỌC");found++;continue;}
  if(/^tiet\s+\d+\s*:/.test(n)){section=target("III. TIẾN TRÌNH DẠY HỌC");append(s);continue;}
  if(/^hoat dong 1[:\s]/.test(n)){activity="1";section=target("Hoạt động 1 (Khởi động)");found++;continue;}
  if(/^hoat dong 2[.\s:(]/.test(n)&&!/^hoat dong 2\.\d/.test(n)){activity="2";section=target("HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC");found++;continue;}
  const sub=n.match(/^hoat dong 2\.(\d+)\s*[:.)\s]/);
  if(sub){activity="2."+sub[1];const name="Hoạt động 2."+sub[1]+". "+s.replace(/^hoạt động 2\.\d+\s*[:.)]?\s*/i,"");section=ensureAct(name);found++;continue;}
  if(/^hoat dong 3[:\s]|^iv[.\s]+hoat dong luyen tap|^iv[.\s]+luyen tap/.test(n)){activity="4";section=target("IV. HOẠT ĐỘNG LUYỆN TẬP");found++;continue;}
  if(/^hoat dong 4[:\s]|^v[.\s]+hoat dong van dung|^v[.\s]+van dung/.test(n)){activity="5";section=target("V. HOẠT ĐỘNG VẬN DỤNG");found++;continue;}
  if(/^(iv|v|vi)[.\s]+huong dan danh gia|^bang danh gia.*nang luc so/.test(n)){section=target("BẢNG ĐÁNH GIÁ VÀ CỤ THỂ HÓA NĂNG LỰC SỐ");activity="";found++;continue;}
  if(/^vi[.\s]+phu luc/.test(n)){section=target("VI. PHỤ LỤC");found++;continue;}
  const fieldMatch=n.match(/^([abcd])[.)]\s*(muc tieu|noi dung|san pham|to chuc thuc hien)\s*:/);
  if(fieldMatch&&activity){let base=section;while(base>0&&!/^(Hoạt động [12]|IV\. HOẠT ĐỘNG|V\. HOẠT ĐỘNG)/.test(result[base].heading))base--;const dest=base+("abcd".indexOf(fieldMatch[1])+1);if(dest<result.length){section=dest;found++;const pos=s.indexOf(":");append(s.slice(pos+1).trim());}continue;}
  if(section>=0)append(line.trim().replace(/^\*\s*/,"- ").replace(/\*\*/g,""));
 }
 if(found<3){const fallback=blankLesson();fallback.find(x=>x.heading.startsWith("Hoạt động 2.1."))!.content=raw.trim();return fallback;}
 return result;
}
