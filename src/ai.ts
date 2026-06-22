import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "You are SkyVibe, a friendly and helpful Discord bot assistant. Keep responses concise, friendly, and use relevant emojis naturally. Answer questions helpfully and conversationally.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });
    return response.choices[0]?.message?.content ?? "✨ I couldn't generate a response right now!";
  } catch (err) {
    console.error("AI error:", err);
    return "⚠️ AI is currently unavailable. Please try again later!";
  }
}
