import { createApp } from "./app.js";
import { config, requireServerConfig } from "./config.js";

requireServerConfig();

createApp().listen(config.port, () => {
  console.log(`Material API đang chạy tại http://localhost:${config.port}`);
});
