import Logger from "@/tools/Logger";
import { Config } from "@/config/Config";
import ProxyController from "@/core/controllers/proxy/ProxyController";

export function createProxyModule(
  config: Config,
  logger: Logger,
): { start: () => Promise<void> } {
  const loggerContext: string = "Proxy module";

  if (config.api.httpsProxy) {
    return {
      start: async () => {
        const proxyController = new ProxyController(
          config.api.httpsProxy!,
          logger.for(loggerContext),
        );

        await proxyController.start();
      },
    };
  } else {
    return {
      start: async () => {},
    };
  }
}
