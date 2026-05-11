import { Logger } from '@nestjs/common';
import { ToolHandler, ToolResult } from "../../common/types";
import { ProductsService } from "../../products/products.service";

const logger = new Logger('deactivateProductTool');

const TIMEOUT_MS = 5000;

export const deactivateProductTool: ToolHandler = async (
  context,
  args
): Promise<ToolResult> => {
  logger.log(JSON.stringify({ event: 'tool_start', tool: 'deactivate_product', businessId: context.businessId }));

  const productId = args.productId;

  if (!productId) {
    return { success: false, error: "VALIDATION_ERROR" };
  }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
  );

  try {
    const repository = ProductsService.getRepository();
    const result = await Promise.race([
      repository.deactivateProduct(context.businessId, productId),
      timeout,
    ]);

    if (result.rowCount === 0) {
      return {
        success: true,
        data: {
          type: "BUSINESS_ERROR",
          message: "❌ No encontré un producto activo con ese ID.",
        },
      };
    }

    const product = result.product;
    logger.log(JSON.stringify({ event: 'tool_complete', tool: 'deactivate_product', productId: product.id }));
    return {
      success: true,
      data: {
        id: product.id,
        title: product.title,
        status: "deactivated",
        display: [
          { label: "Producto", value: product.title },
          { label: "Estado", value: "Desactivado" },
        ],
      },
    };
  } catch (error) {
    const errMsg = (error as Error).message;
    logger.error(JSON.stringify({ event: 'tool_error', tool: 'deactivate_product', error: errMsg }));
    if (errMsg === "TIMEOUT") {
      return { success: false, error: "TIMEOUT" };
    }
    return {
      success: false,
      error: "INTERNAL_ERROR",
    };
  }
};