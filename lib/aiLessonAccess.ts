import { currentServerUser, AuthError } from "@/lib/authServer";
import { canAuthor } from "@/lib/permissions";
export async function requireLessonAuthor() {
  const user = await currentServerUser();
  if (!user) throw new AuthError("Vui lòng đăng nhập.", 401);
  if (!canAuthor(user.accessRole)) throw new AuthError("Bạn không có quyền soạn giáo án.", 403);
  return user;
}
export function validateLessonInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AuthError("Dữ liệu không hợp lệ.",400);
  const body = input as Record<string, unknown>;
  const str = (name: string,max: number) => {
    if (body[name] !== undefined && typeof body[name] !== "string") throw new AuthError("Sai định dạng: "+name,400);
    const value=(body[name] as string|undefined ?? "").trim();
    if(value.length>max) throw new AuthError(name+" quá dài.",400);
    return value;
  };
  const title=str("title",200);
  if(!title) throw new AuthError("Cần nhập tên bài học.",400);
  const periods=Number(body.periods ?? 1);
  if(!Number.isInteger(periods)||periods<1||periods>30) throw new AuthError("Số tiết không hợp lệ.",400);
  return {title,subject:str("subject",100),grade:str("grade",30),textbook:str("textbook",150),objectives:str("objectives",15000),periods};
}
