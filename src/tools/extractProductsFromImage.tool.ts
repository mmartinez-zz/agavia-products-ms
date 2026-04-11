import { ToolHandler, ToolResult } from "../types";
import { createProduct } from "../repositories/product.repository";

const TIMEOUT_MS = 3000;

const PROMPT = `Analiza la imagen y extrae TODOS los productos visibles.

Devuelve SOLO un JSON válido con este formato:

[
  {
    "title": "string",
    "price": number,
    "description": "string"
  }
]

Reglas:

* Cada producto debe ser independiente
* El precio debe estar en pesos colombianos (COP)
* El precio debe ser un número entero sin puntos ni comas (ej: 1399000)
* NO inventes información
* NO incluyas productos sin precio visible
* NO mezcles datos entre productos
* Si no estás seguro del precio, NO incluyas ese producto

Devuelve SOLO el JSON, sin texto adicional.`;

interface ExtractedProduct {
  title: string;
  price: number;
  description: string;
}

async function callOpenAI(imageUrl: string): Promise<ExtractedProduct[]> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: PROMPT,
            },
            {
              type: "input_image",
              image_url: imageUrl,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("OPENAI_ERROR");
  }

  const data: any = await response.json();

  console.debug('[extractProductsFromImage] OpenAI raw response received');

  const outputText =
    data.output_text || data.output?.[0]?.content?.[0]?.text || "";

  console.debug('[extractProductsFromImage] OpenAI output text:', outputText);
  if (!outputText) {
    console.debug('[extractProductsFromImage] No products extracted from image');
    return [];
  }

  try {
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.debug('[extractProductsFromImage] Failed to parse OpenAI response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const products = Array.isArray(parsed) ? parsed : [];
    console.debug('[extractProductsFromImage] Parsed products count:', products.length);
    return products;
  } catch {
    console.debug('[extractProductsFromImage] Failed to parse OpenAI response');
    return [];
  }
}

function isValidProduct(product: any): product is ExtractedProduct {
  return (
    typeof product.title === "string" &&
    product.title.trim().length > 0 &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    product.price > 0
  );
}

export const extractProductsFromImageTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  console.info('[extractProductsFromImage] Request', { businessId: context.businessId, args });

  if (!args.imageUrl || typeof args.imageUrl !== "string") {
    return { success: false, error: "VALIDATION_ERROR" };
  }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS),
  );

  try {
    const extractedProducts = await Promise.race([
      callOpenAI(args.imageUrl),
      timeout,
    ]);

    const validProducts = extractedProducts.filter(isValidProduct);

    console.debug('[extractProductsFromImage] Valid products count:', validProducts.length);

    console.debug('[extractProductsFromImage] Saving products...');
    let created = 0;
    for (const product of validProducts) {
      try {
        await createProduct({
          businessId: context.businessId,
          title: product.title.trim(),
          description: product.description || null,
          price: product.price,
          imageUrl: args.imageUrl,
          sourceType: "image_extraction",
        });
        created++;
      } catch (error) {
        console.debug(`[extractProductsFromImage] Failed to create product: ${error}`);
      }
    }

    console.debug('[extractProductsFromImage] Products saved:', created);

    const result = {
      success: true,
      data: { created },
    };

    console.info('[extractProductsFromImage] Response', { success: true, created });
    return result;
  } catch (error: any) {
    console.info('[extractProductsFromImage] Response', { success: false, error: error.message });

    if (error.message === "TIMEOUT") {
      throw error;
    }
    return { success: false, error: "INTERNAL_ERROR" };
  }
};
