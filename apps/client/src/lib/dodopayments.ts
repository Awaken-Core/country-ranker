import DodoPayments from "dodopayments";
import { env } from "./env";

type dodo_env = "test_mode" | "live_mode";

export const dodopayments = new DodoPayments({
  environment: env.DODO_PAYMENTS_ENVIRONMENT as dodo_env,
  bearerToken: env.DODO_PAYMENTS_API_KEY,
  webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
});