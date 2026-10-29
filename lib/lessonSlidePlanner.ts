import type {SlideContent} from "./wordToPptx";
export type Stage="cover"|"goals"|"roadmap"|"warmup"|"task"|"report"|"conclusion"|"summary"|"practice"|"application";
export type PlannedSlide=SlideContent&{stage:Stage;note:string;sourceHeading:string};
const short=(s:string,n=150)=>s.trim().length>n?s.trim().slice(0,n-1).replace(/\s+\S*$/,"")+"…":s.trim();
const stageName:Record<Stage,string>={cover:"Trang bìa",goals:"Mục tiêu",roadmap:"Lộ trình",warmup:"Khởi động",task:"Khám phá",report:"Báo cáo",conclusion:"Chốt kiến thức",summary:"Tổng kết",practice:"Luyện tập",application:"Vận dụng"};
export const STAGE_NAMES=stageName;
const clean=(s:string)=>s.replace(/^\s*[-•*]\s*/,"").replace(/\s+/g," ").trim();
const keywords=(items:string[],count=3)=>items.filter(Boolean).slice(0,count).map(x=>short(clean(x),125));
const titleMatch=(s:string)=>/^(I{1,3}|IV|V|VI|VII)\.\s|^\d+[\.\)]\s|^hoạt động\s+\d+/i.test(s);
export function planLessonSlides(source:SlideContent[],baseName:string):{slides:PlannedSlide[];warnings:string[]}{
 const warnings:string[]=[];
 if(!source.length)return {slides:[],warnings:["Chưa có nội dung nguồn để lập kế hoạch."]};
 const topic=source.find(x=>x.title&& !/^I\.\s*mục tiêu/i.test(x.title))?.title||baseName.replace(/\.docx$/i,"");
 const chapters=source.filter(x=>x.bullets.length&&x.title&& !/mục tiêu|thiết bị|học liệu|khởi động|luyện tập|vận dụng|phẩm chất|phụ lục/i.test(x.title)).filter(x=>titleMatch(x.title)||x.bullets.length>1);
 const sourceChapters=chapters.length?chapters:source.filter(x=>x.bullets.length);
 const outcomes=source.filter(x=>/mục tiêu|kiến thức|năng lực/i.test(x.title)).flatMap(x=>x.bullets);
 const warmup=source.find(x=>/khởi động|mở đầu/i.test(x.title));
 const practice=source.find(x=>/luyện tập/i.test(x.title));
 const application=source.find(x=>/vận dụng/i.test(x.title));
 const slides:PlannedSlide[]=[];
 const add=(stage:Stage,title:string,bullets:string[],sourceHeading="",note="")=>slides.push({stage,title:short(title,115),bullets:bullets.map(x=>short(x,180)).slice(0,6),sourceHeading,note});
 add("cover",topic,[],topic,"Giữ nguyên tên bài theo tài liệu nguồn.");
 add("goals","MỤC TIÊU BÀI HỌC",keywords(outcomes,3).length?keywords(outcomes,3):["[Giáo viên bổ sung mục tiêu kiến thức]","[Giáo viên bổ sung mục tiêu năng lực]"],"","Mục tiêu chỉ lấy từ tài liệu khi có.");
 add("roadmap","NỘI DUNG BÀI HỌC",sourceChapters.slice(0,5).map(x=>x.title),"","Thứ tự mục giữ theo thứ tự tài liệu.");
 add("warmup",warmup?.title||"KHỞI ĐỘNG",warmup?keywords(warmup.bullets,2):["[Bổ sung học liệu trực quan từ nguồn]","[Giáo viên đặt câu hỏi khởi động]"],warmup?.title||"","Chưa có hoạt động khởi động trong nguồn thì cần giáo viên soạn.");
 if(!warmup)warnings.push("Không tìm thấy mục Khởi động rõ ràng; đã tạo khung để giáo viên hoàn thiện.");
 for(const ch of sourceChapters.slice(0,12)){
  const key=keywords(ch.bullets,4);
  add("task",ch.title,["QUAN SÁT / ĐỌC HỌC LIỆU",...key.slice(0,2),"[Giáo viên viết câu hỏi hoặc nhiệm vụ từ nội dung trên]"],ch.title,"Slide nhiệm vụ: giữ dữ liệu nguồn; cần chọn học liệu và câu hỏi thích hợp.");
  add("report","THẢO LUẬN – BÁO CÁO: "+ch.title,["[Học sinh trình bày kết quả]","[Bạn học nhận xét, bổ sung]","[Giáo viên đối chiếu với tài liệu nguồn]"],ch.title,"Khung hoạt động, không tự tạo câu trả lời không có trong nguồn.");
  add("conclusion","CHỐT KIẾN THỨC: "+ch.title,key.length?key:["[Giáo viên bổ sung nội dung chốt]"],ch.title,"Tóm tắt văn bản gốc; giáo viên kiểm duyệt trước khi dùng.");
 }
 add("summary","TỔNG KẾT BÀI HỌC",sourceChapters.slice(0,4).map(x=>x.title),"","Có thể thay bằng sơ đồ tư duy hoặc infographic.");
 add("practice",practice?.title||"LUYỆN TẬP",practice?keywords(practice.bullets,4):["[Bổ sung 2–4 câu hỏi từ tài liệu nguồn]"],practice?.title||"","Chỉ lấy câu hỏi gốc khi có; không tự dựng đáp án.");
 add("application",application?.title||"VẬN DỤNG",application?keywords(application.bullets,3):["[Giáo viên giao nhiệm vụ liên hệ thực tế]","[Ghi rõ sản phẩm học sinh cần nộp]"],application?.title||"","Bảo đảm nhiệm vụ phù hợp thời lượng và đối tượng học sinh.");
 if(!practice)warnings.push("Không phát hiện mục Luyện tập trong tài liệu; cần bổ sung.");
 if(!application)warnings.push("Không phát hiện mục Vận dụng trong tài liệu; cần bổ sung.");
 if(sourceChapters.length>12)warnings.push("Nguồn có nhiều hơn 12 nhóm nội dung; bản MVP chỉ tạo kế hoạch tối đa 12 nhóm, cần chia thành nhiều bài để tránh bỏ sót.");
 if(slides.length>80)warnings.push("Kế hoạch vượt 80 slide; hãy tinh giản nội dung hoặc tách thành bài riêng.");
 return {slides:slides.slice(0,80),warnings};
}
