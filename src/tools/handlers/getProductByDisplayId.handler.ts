import { Logger } from "@nestjs/common";
import { ToolHandler, ToolResult } from "../../common/types";
import { ProductsService } from "../../products/products.service";

const logger = new Logger("getProductByDisplayIdTool");

export const getProductByDisplayIdTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  logger.log(
    `[getProductByDisplayId] Request - businessId: ${context.businessId}, displayId: ${args.displayId}`,
  );
  logger.debug(`[getProductByDisplayId] Args received:`, JSON.stringify(args));

  const displayId = args.displayId;
  logger.debug(`[getProductByDisplayId] DisplayId type: ${typeof displayId}, value: ${displayId}`);

  if (
    typeof displayId !== "number" ||
    !Number.isInteger(displayId) ||
    displayId <= 0
  ) {
    logger.debug(`[getProductByDisplayId] Validation failed - displayId type: ${typeof displayId}, value: ${displayId}, isInteger: ${Number.isInteger(displayId)}`);
    return {
      success: true,
      data: {
        type: "BUSINESS_ERROR",
        message: `El dato que ingresaste es incorrecto.`,
      },
    };
  }

  let product: any;
  try {
    logger.debug(`[getProductByDisplayId] Calling repository.getProductByDisplayId - displayId: ${displayId}`);
    const repository = ProductsService.getRepository();
    product = await repository.getProductByDisplayId(context.businessId, displayId);
  } catch (error: any) {
    logger.error(`[getProductByDisplayId] Error fetching product - ${error.message}`, error.stack);
    return { success: false, error: "INTERNAL_ERROR" };
  }

  if (!product) {
    logger.debug(`[getProductByDisplayId] Product not found - displayId: ${displayId}, businessId: ${context.businessId}`);
    return {
      success: true,
      data: {
        type: "BUSINESS_ERROR",
        message: `No se encontró un producto con ID ${displayId}`,
      },
    };
  }

  logger.debug(`[getProductByDisplayId] Product found - id: ${product.id}, displayId: ${product.displayId}, title: "${product.title}", price: ${product.price}`);

  const response = {
    success: true,
    data: {
      product: {
        productId: product.id,
        displayId: product.displayId,
        title: product.title,
        price: product.price,
      },
      display: [
        { label: "ID", value: product.displayId },
        { label: "Título", value: product.title },
        { label: "Precio", value: `$${product.price.toLocaleString()}` },
        ...(product.description
          ? [{ label: "Descripción", value: product.description }]
          : []),
      ],
      imageUrl: product.imageUrl || null,
    },
  };

  logger.log(
    `[getProductByDisplayId] Response - success: true, displayId: ${product.displayId}`,
  );
  return response;
};
