// Telegram outbound notifier — used by the optimizer cron to surface
// auto-actions to the founder. Per-user notification preferences are not
// modeled yet; this just dispatches to TELEGRAM_CHAT_ID from the env.
//
// TODO: when we ship multi-user, store telegramChatId on the User row
// and resolve recipients per-campaign owner.

const API = "https://api.telegram.org";

export interface NotifyOptions {
  text: string;
  silent?: boolean;
}

export async function sendTelegram({ text, silent }: NotifyOptions): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // not configured — no-op

  try {
    await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_notification: !!silent,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    // Notification failures must never crash the cron — log and move on.
    console.error("Telegram notify failed:", err);
  }
}
