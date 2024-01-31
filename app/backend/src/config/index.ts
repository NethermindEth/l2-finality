import { Config } from "./Config";
import { getLocalConfig } from "./config.local";
import { getEnv } from "../tools/Env";
import { getTestConfig } from "./config.test";

export type { Config };

export function getConfig(): Config {
  const env = getEnv();
  const deploymentEnv = env.optionalString("DEPLOYMENT_ENV") ?? "local";
  console.log("Loading config for:", deploymentEnv);

  switch (deploymentEnv) {
    case "test":
      return getTestConfig(env);
    case "local":
      return getLocalConfig(env);
  }

  throw new TypeError(`Unrecognized env: ${deploymentEnv}!`);
}
