import axios from "axios";
import Logger from "@/tools/Logger";

export function handleError(error: any, logger: Logger): void {
  if (axios.isAxiosError(error)) {
    const method = error.config?.method?.toUpperCase() ?? "UNKNOWN METHOD";
    const url = error.config?.url ?? "UNKNOWN URL";
    const status = error.response?.status || "No response";
    const errorMessage = error.response?.data?.message || error.message;

    logger.error(
      `AxiosError: ${method} ${url} - Status: ${status} - Message: ${errorMessage}`,
    );
  } else {
    logger.error("Unexpected error", error);
  }
}
