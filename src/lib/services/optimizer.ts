// ROAS optimization decision engine — pure functions, no IO.
// The cron route in /api/cron/optimize wires this up to Firestore + Meta API.

export interface OptimizerInput {
  campaignId: string;
  /** Target ROAS the user set in the wizard. */
  targetRoas: number;
  /** Last 3-day rolled-up ROAS from Meta insights. */
  recentRoas: number;
  /** Last 3-day rolled-up spend (USD). Used as a noise floor. */
  recentSpend: number;
  /** Current daily budget on the campaign (USD). */
  currentDailyBudget: number;
  /** Original daily budget the user set — caps how far we can scale. */
  originalDailyBudget: number;
  /** "active" | "paused" | "archived" — we never resume archived. */
  status: string;
}

export type OptimizerAction =
  | { kind: "noop"; reason: string }
  | { kind: "pause"; reason: string }
  | { kind: "scale_budget"; nextDailyBudget: number; reason: string };

/**
 * Decide what to do with a single campaign for one optimization tick.
 *
 * Guardrails:
 * - Need at least $5 of spend in the window before acting (statistical noise).
 * - Never touch archived campaigns.
 * - Budget moves are capped at ±20% per tick.
 * - Daily budget never exceeds 2× the user's original setting.
 * - We only pause when ROAS is *severely* below target (< 50%).
 */
export function decide(input: OptimizerInput): OptimizerAction {
  if (input.status === "archived") {
    return { kind: "noop", reason: "archived" };
  }
  if (input.recentSpend < 5) {
    return { kind: "noop", reason: "insufficient_spend" };
  }
  if (input.targetRoas <= 0) {
    return { kind: "noop", reason: "no_target" };
  }

  const ratio = input.recentRoas / input.targetRoas;

  // Severely underperforming → pause to stop the bleeding.
  if (ratio < 0.5 && input.status === "active") {
    return {
      kind: "pause",
      reason: `roas_${input.recentRoas.toFixed(2)}x_below_half_target`,
    };
  }

  // Underperforming but not catastrophic → scale budget down 20%.
  if (ratio < 0.8) {
    const next = Math.max(
      5,
      Math.round(input.currentDailyBudget * 0.8)
    );
    if (next === input.currentDailyBudget) {
      return { kind: "noop", reason: "budget_at_floor" };
    }
    return {
      kind: "scale_budget",
      nextDailyBudget: next,
      reason: `roas_${input.recentRoas.toFixed(2)}x_below_target`,
    };
  }

  // Crushing target → scale budget up 20%, capped at 2× original.
  if (ratio > 1.5) {
    const cap = input.originalDailyBudget * 2;
    const next = Math.min(
      cap,
      Math.round(input.currentDailyBudget * 1.2)
    );
    if (next === input.currentDailyBudget) {
      return { kind: "noop", reason: "budget_at_cap" };
    }
    return {
      kind: "scale_budget",
      nextDailyBudget: next,
      reason: `roas_${input.recentRoas.toFixed(2)}x_above_target`,
    };
  }

  return { kind: "noop", reason: "within_band" };
}
