const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL!;

export async function logChat(params: {
  question: string;
  answer: string;
  userId?: string | null;
}) {
  try {
    await fetch(`${ADMIN_URL}/api/chats/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.error("Failed to log chat", e);
  }
}
