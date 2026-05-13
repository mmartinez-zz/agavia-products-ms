import { Injectable } from '@nestjs/common';
import { logger } from '@mmartinez-zz/agavia-observability';
import { ToolContext, ToolHandler, ToolResult } from '../common/types';
import { createProductTool } from './handlers/createProduct.handler';
import { extractProductsFromImageTool } from './handlers/extractProductsFromImage.handler';
import { listProductsTool } from './handlers/listProducts.handler';
import { getProductByDisplayIdTool } from './handlers/getProductByDisplayId.handler';
import { updateProductTool } from './handlers/updateProduct.handler';
import { deactivateProductTool } from './handlers/deactivateProduct.handler';

@Injectable()
export class ToolsService {
  private toolRegistry: Record<string, ToolHandler> = {
    create_product_from_chat: createProductTool,
    extract_products_from_image: extractProductsFromImageTool,
    list_products: listProductsTool,
    get_product_by_displayId: getProductByDisplayIdTool,
    update_product: updateProductTool,
    deactivate_product: deactivateProductTool,
  };

  async execute(
    tool: string,
    context: ToolContext,
    args: Record<string, any>
  ): Promise<ToolResult> {
    logger.debug({ event: 'tool_resolving', tool, businessId: context.businessId });

    const handler = this.toolRegistry[tool];

    if (!handler) {
      logger.error({ event: 'tool_not_found', tool, businessId: context.businessId });
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    logger.debug({ event: 'tool_executing', tool, businessId: context.businessId });

    try {
      const result = await handler(context, args);

      logger.debug({ event: 'tool_completed', tool, businessId: context.businessId, success: result?.success });

      return result;
    } catch (error: any) {
      logger.error({ event: 'tool_execution_error', tool, businessId: context.businessId, error: error.message });
      if (error.message === 'TIMEOUT') {
        return { success: false, error: 'TIMEOUT' };
      }
      return { success: false, error: 'INTERNAL_ERROR' };
    }
  }
}
