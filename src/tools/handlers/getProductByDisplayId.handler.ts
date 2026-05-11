import { logger } from "@mmartinez-zz/agavia-observability";
import { ToolHandler, ToolResult } from "../../common/types";
import { ProductsService } from "../../products/products.service";

export const getProductByDisplayIdTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  logger.log({ event: 'tool_start', tool: 'get_product_by_display_id', businessId: context.businessId });

  const displayId = args.displayId;

  if (
    typeof displayId !== "number" ||
    !Number.isInteger(displayId) ||
    displayId <= 0
  ) {
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
    const repository = ProductsService.getRepository();
    product = await repository.getProductByDisplayId(context.businessId, displayId);
  } catch (error: any) {
    logger.error({ event: 'tool_error', tool: 'get_product_by_display_id', error: error.message });
    return { success: false, error: "INTERNAL_ERROR" };
  }

  if (!product) {
    return {
      success: true,
      data: {
        type: "BUSINESS_ERROR",
        message: `No se encontró un producto con ID ${displayId}`,
      },
    };
  }

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

  logger.log({ event: 'tool_complete', tool: 'get_product_by_display_id', displayId: product.displayId });
  return response;
};
