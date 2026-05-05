import { Logger } from "@nestjs/common";
import { callOpenAI } from "./openai.adapter";

const logger = new Logger("generateKeywords");

const PROMPT = `A partir del título y la descripción de un producto, genera entre 2 y 6 keywords relevantes en español que sirvan para búsqueda y categorización.

Devuelve SOLO un JSON válido con este formato:

["keyword1", "keyword2", "keyword3"]

Reglas:
* Las keywords deben ser palabras o frases cortas (máximo 3 palabras)
* Deben ser en minúsculas
* Deben ser relevantes al producto
* No repitas palabras del título literalmente, generaliza
* Devuelve SOLO el JSON, sin texto adicional.`;

export async function generateKeywords(
  title: string,
  description?: string | null,
): Promise<string[]> {
  const inputText = description
    ? `Título: ${title}\nDescripción: ${description}`
    : `Título: ${title}`;

  logger.debug(`[generateKeywords] Calling OpenAI for product: "${title}"`);

  let outputText: string;
  try {
    outputText = await callOpenAI([
      {
        role: "user",
        content: [{ type: "input_text", text: `${PROMPT}\n\n${inputText}` }],
      },
    ]);
  } catch (error: any) {
    logger.error(`[generateKeywords] OpenAI error: ${error.message}`);
    return [];
  }

  if (!outputText) {
    logger.debug("[generateKeywords] Empty response from OpenAI");
    return [];
  }

  try {
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.debug("[generateKeywords] Could not find JSON array in response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const keywords: string[] = Array.isArray(parsed)
      ? parsed.filter((k) => typeof k === "string" && k.trim().length > 0).slice(0, 6)
      : [];

    logger.debug(`[generateKeywords] Generated ${keywords.length} keywords: ${keywords.join(", ")}`);
    return keywords;
  } catch {
    logger.debug("[generateKeywords] Failed to parse OpenAI response");
    return [];
  }
}
