import {
  PrismaClient,
} from "@prisma/client";

import {
  createInterface,
} from "node:readline/promises";

import {
  stdin as input,
  stdout as output,
} from "node:process";

const db =
  new PrismaClient();

function normalizeEmail(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}

async function main() {
  const users =
    await db.user.findMany(
      {
        orderBy: {
          createdAt:
            "asc",
        },
        select: {
          id:
            true,
          email:
            true,
          displayName:
            true,
          accessRole:
            true,
          isActive:
            true,
        },
      }
    );

  if (
    users.length ===
    0
  ) {
    console.log(
      "\nChưa có tài khoản nào trong database."
    );
    console.log(
      "Hãy khởi động VLearning, tạo tài khoản đầu tiên; tài khoản đầu tiên sẽ tự động là ADMIN."
    );
    return;
  }

  console.log(
    "\nDanh sách tài khoản:"
  );

  users.forEach(
    (
      user,
      index
    ) => {
      console.log(
        `${index + 1}. ${user.displayName} <${user.email}> | ${user.accessRole} | ${user.isActive ? "ACTIVE" : "DISABLED"}`
      );
    }
  );

  const argEmail =
    normalizeEmail(
      process.argv[2]
    );

  let email =
    argEmail;

  if (
    !email
  ) {
    const rl =
      createInterface(
        {
          input,
          output,
        }
      );

    email =
      normalizeEmail(
        await rl.question(
          "\nNhập email muốn nâng thành ADMIN: "
        )
      );

    rl.close();
  }

  const user =
    await db.user.findUnique(
      {
        where: {
          email,
        },
      }
    );

  if (
    !user
  ) {
    throw new Error(
      `Không tìm thấy tài khoản: ${email}`
    );
  }

  const updated =
    await db.user.update(
      {
        where: {
          id:
            user.id,
        },
        data: {
          accessRole:
            "ADMIN",
          isActive:
            true,
        },
      }
    );

  await db.session.deleteMany(
    {
      where: {
        userId:
          updated.id,
      },
    }
  );

  console.log(
    `\nĐã nâng ${updated.displayName} <${updated.email}> thành ADMIN.`
  );
  console.log(
    "Tài khoản này cần đăng nhập lại để quyền mới có hiệu lực."
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "\nKhông thể nâng quyền ADMIN:"
      );
      console.error(
        error
      );
      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await db.$disconnect();
    }
  );
