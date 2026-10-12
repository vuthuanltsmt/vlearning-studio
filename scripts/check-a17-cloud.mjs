import {
  PrismaClient,
} from "../generated/cloud-prisma/index.js";

const db =
  new PrismaClient();

async function main() {
  const count =
    await db.cloudProject.count();

  console.log(
    "\nA17 CLOUD DATABASE ONLINE"
  );
  console.log(
    `CloudProject rows: ${count}`
  );
}

main()
  .catch(
    (
      error
    ) => {
      console.error(
        "\nA17 CLOUD DATABASE CHECK FAILED"
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
