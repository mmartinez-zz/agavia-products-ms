import { Logger } from "@nestjs/common";

const logger = new Logger("openaiAdapter");

export interface OpenAIMessage {
  role: "user" | "assistant";
  content: OpenAIContentPart[];
}

export type OpenAIContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export async function callOpenAI(messages: OpenAIMessage[]): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.4-nano",
      input: messages,
    }),
  });

  if (!response.ok) {
    logger.error(JSON.stringify({ event: 'openai_api_error', status: response.status }));
    throw new Error("OPENAI_ERROR");
  }

  const data: any = await response.json();
  return data.output_text || data.output?.[0]?.content?.[0]?.text || "";
}
