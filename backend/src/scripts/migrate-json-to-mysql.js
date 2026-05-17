const fs = require("fs");
const path = require("path");
const { createSeedData } = require("../seed");
const {
  DATABASE_PROVIDER,
  dbFilePath,
  disconnectDb,
  ensureStorage,
  persistSnapshotToMysql
} = require("../db");

async function loadSourceSnapshot() {
  try {
    const raw = await fs.promises.readFile(dbFilePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return createSeedData();
  }
}

async function main() {
  if (DATABASE_PROVIDER !== "mysql") {
    throw new Error("请先设置 DATABASE_PROVIDER=mysql，再执行该迁移脚本。");
  }

  const snapshot = await loadSourceSnapshot();
  await ensureStorage();
  await persistSnapshotToMysql(snapshot);

  console.log("JSON 数据已写入 MySQL。");
  console.log(`数据来源：${path.relative(process.cwd(), dbFilePath)}`);
  console.log(`航空器：${snapshot.aircraft?.length || 0}`);
  console.log(`事件：${snapshot.events?.length || 0}`);
  console.log(`人物：${snapshot.persons?.length || 0}`);
  console.log(`用户：${snapshot.users?.length || 0}`);
}

main()
  .catch((error) => {
    console.error("迁移失败：", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb();
  });
