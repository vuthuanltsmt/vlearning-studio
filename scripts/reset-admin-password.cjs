const { PrismaClient } = require("@prisma/client");
const { randomBytes, scrypt: scryptCallback } = require("node:crypto");
const { promisify } = require("node:util");

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hashPassword(password, saltHex) {
  const result = await scrypt(
    password,
    Buffer.from(saltHex, "hex"),
    64
  );

  return result.toString("hex");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("");
    console.log("Cách dùng:");
    console.log(
      'node scripts/reset-admin-password.cjs "email-admin" "MatKhauMoi123"'
    );
    console.log("");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
  }

  if (!/[A-Za-zÀ-ỹ]/.test(newPassword)) {
    throw new Error("Mật khẩu phải có ít nhất 1 chữ cái.");
  }

  if (!/\d/.test(newPassword)) {
    throw new Error("Mật khẩu phải có ít nhất 1 chữ số.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(`Không tìm thấy tài khoản: ${email}`);
  }

  if (user.accessRole !== "ADMIN") {
    throw new Error(
      `Tài khoản ${email} không phải ADMIN. Quyền hiện tại: ${user.accessRole}`
    );
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(newPassword, salt);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordSalt: salt,
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        isActive: true,
      },
    }),

    prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    }),
  ]);

  console.log("");
  console.log("==============================================");
  console.log("RESET MẬT KHẨU ADMIN THÀNH CÔNG");
  console.log(`Email: ${email}`);
  console.log("Các phiên đăng nhập cũ đã được đăng xuất.");
  console.log("==============================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("RESET FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });