export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = [...new Set([process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID_2].filter(Boolean))];
  if (!token || !process.env.TELEGRAM_CHAT_ID) throw new Error('Telegram environment variables are not configured.');

  const results = await Promise.allSettled(chatIds.map(async (chatId) => {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.description || `HTTP ${response.status}`);
  }));

  results.forEach((result, index) => {
    if (result.status === 'rejected') console.error(`Telegram sendMessage failed for chat ${chatIds[index]}:`, result.reason);
  });
  if (results.every((result) => result.status === 'rejected')) throw new Error('Telegram delivery failed for all chats.');
}
