import { Application } from "./Application";
import { getConfig } from "./config";

async function main() {
  try {
    const config = getConfig();
    const app = new Application(config);
    await app.start();
  } catch (e) {
    console.error(e);
    throw e;
  }
}

main().catch(() => {
  process.exit(1);
});
