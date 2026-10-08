import DodoPayments from "dodopayments";
import { env } from "./env";

type dodo_env = "test_mode" | "live_mode";

export const dodopayments = new DodoPayments({
  environment: (env.DODO_PAYMENTS_ENVIRONMENT as dodo_env) || "test_mode",
  bearerToken: env.DODO_PAYMENTS_API_KEY || "dummy_dodo_key",
  webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY || "dummy_webhook_key",
});