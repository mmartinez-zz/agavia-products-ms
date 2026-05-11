import { logger } from "@mmartinez-zz/agavia-observability";
import { ToolHandler, ToolResult } from "../../common/types";
import { ProductsService } from "../../products/products.service";

export const updateProductTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  logger.log({ event: 'tool_start', tool: 'update_product', businessId: context.businessId });

  const productId = args.productId;

  if (typeof productId !== "string") {
    return {
      success: false,
      error: "VALIDATION_ERROR",
    };
  }

  let repository: ReturnType<typeof ProductsService.getRepository>;
  let existing: any;

  try {
    repository = ProductsService.getRepository();
    existing = await repository.getProductById(context.businessId, productId);
  } catch (error: any) {
    logger.error({ event: 'tool_error', tool: 'update_product', error: error.message });
    return { success: false, error: "INTERNAL_ERROR" };
  }

  if (!existing) {
    return {
      success: true,
      data: {
        type: "BUSINESS_ERROR",
        message: "❌ No encontré ese producto para actualizar.",
      },
    };
  }

  // 🔧 BUILD UPDATE
  const dataToUpdate: any = {};

  if (typeof args.title === "string" && args.title.trim() !== "") {
    dataToUpdate.title = args.title.trim();
  }

  if (typeof args.price === "number" && args.price > 0) {
    dataToUpdate.price = args.price;
  }

  if (typeof args.description === "string") {
    dataToUpdate.description = args.description;
  }

  if (typeof args.imageUrl === "string" && args.imageUrl.startsWith("http")) {
    dataToUpdate.imageUrl = args.imageUrl;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return {
      success: true,
      data: {
        type: "BUSINESS_ERROR",
        message:
          "⚠️ Indícame qué quieres actualizar (precio, título, descripción o imagen).",
      },
    };
  }

  let updated: any;
  try {
    updated = await repository.updateProduct({
      id: existing.id,
      businessId: context.businessId,
      title: dataToUpdate.title,
      price: dataToUpdate.price,
      description: dataToUpdate.description,
      imageUrl: dataToUpdate.imageUrl,
    });
  } catch (error: any) {
    logger.error({ event: 'tool_error', tool: 'update_product', error: error.message });
    return { success: false, error: "INTERNAL_ERROR" };
  }

  if (!updated) {
    logger.error({ event: 'tool_error', tool: 'update_product', error: 'no_result', productId: existing.id });
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }

  // 🎯 RESPONSE UNIFICADA (MISMO CONTRATO QUE CREATE)
  const result = {
    success: true,
    data: {
      id: updated.id,
      displayId: updated.displayId,
      title: updated.title,
      price: updated.price,
      description: updated.description ?? null,

      ...(updated.imageUrl ? { imageUrl: updated.imageUrl } : {}),

      display: [
        { label: "ID", value: updated.displayId },
        { label: "Título", value: updated.title },
        { label: "Precio", value: `$${updated.price.toLocaleString()}` },
      ],
    },
  };

  logger.log({ event: 'tool_complete', tool: 'update_product', displayId: updated.displayId });
  return result;
};
