import { createApp } from "./app.js";
import { config, requireServerConfig } from "./config.js";
import { mergeDirectorRoleIntoAdmin } from "./services/role-migration.js";

requireServerConfig();

async function start() {
  await mergeDirectorRoleIntoAdmin();
  createApp().listen(config.port, () => {
    console.log(`Material API đang chạy tại http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Không thể khởi động Material API.", error);
  process.exit(1);
});
