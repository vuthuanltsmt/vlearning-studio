import {
  createInterface,
} from "node:readline/promises";

import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import {
  stdin as input,
  stdout as output,
} from "node:process";

const envPath =
  ".env";

function updateEnv(
  text,
  key,
  value
) {
  const lines =
    text
      .split(
        /\r?\n/
      )
      .filter(
        (
          line
        ) =>
          !line.startsWith(
            `${key}=`
          )
      );

  lines.push(
    `${key}=${JSON.stringify(
      value
    )}`
  );

  return (
    lines
      .filter(
        (
          line,
          index,
          all
        ) =>
          !(
            index ===
              all.length -
                1 &&
            line ===
              ""
          )
      )
      .join(
        "\n"
      ) +
    "\n"
  );
}

async function main() {
  const existing =
    existsSync(
      envPath
    )
      ? readFileSync(
          envPath,
          "utf8"
        )
      : "";

  const current =
    existing
      .split(
        /\r?\n/
      )
      .find(
        (
          line
        ) =>
          line.startsWith(
            "CLOUD_DATABASE_URL="
          )
      );

  if (
    current
  ) {
    console.log(
      "\nCLOUD_DATABASE_URL đã tồn tại trong .env."
    );
  }

  const rl =
    createInterface(
      {
        input,
        output,
      }
    );

  const url =
    (
      await rl.question(
        "\nDán PostgreSQL connection URL (postgresql://...): "
      )
    ).trim();

  rl.close();

  if (
    !/^postgres(?:ql)?:\/\//i.test(
      url
    )
  ) {
    throw new Error(
      "Connection URL phải bắt đầu bằng postgresql:// hoặc postgres://"
    );
  }

  writeFileSync(
    envPath,
    updateEnv(
      existing,
      "CLOUD_DATABASE_URL",
      url
    ),
    "utf8"
  );

  console.log(
    "\nĐã lưu CLOUD_DATABASE_URL vào .env."
  );
}

main().catch(
  (
    error
  ) => {
    console.error(
      "\nKhông thể cấu hình Cloud:"
    );
    console.error(
      error.message ??
      error
    );
    process.exitCode =
      1;
  }
);
