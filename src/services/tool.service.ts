import { ToolContext, ToolHandler, ToolResult } from '../types';
import { createProductTool } from '../tools/createProduct.tool';
import { extractProductsFromImageTool } from '../tools/extractProductsFromImage.tool';
import { listProductsTool } from '../tools/listProducts.tool';
import { getProductByDisplayIdTool } from '../tools/getProductByDisplayId.tool';
import { updateProductTool } from '../tools/updateProduct.tool';

const toolRegistry: Record<string, ToolHandler> = {
  create_product_from_chat: createProductTool,
  extract_products_from_image: extractProductsFromImageTool,
  list_products: listProductsTool,
  get_product_by_displayId: getProductByDisplayIdTool,
  update_product: updateProductTool,
};

export async function executeTool(
  tool: string,
  context: ToolContext,
  args: Record<string, any>
): Promise<ToolResult> {
  console.log('[TOOL-MS] Resolving tool:', tool);

  const handler = toolRegistry[tool];

  if (!handler) {
    console.error('[TOOL-MS] Tool not found:', tool);
    return { success: false, error: 'VALIDATION_ERROR' };
  }

  console.log('[TOOL-MS] Executing tool:', {
    tool: tool,
    businessId: context.businessId
  });

  try {
    const result = await handler(context, args);

    console.log('[TOOL-MS] Tool execution completed:', {
      tool: tool,
      success: result?.success
    });

    return result;
  } catch (error: any) {
    console.error(`[${tool}] Error: ${error.message}`);
    if (error.message === 'TIMEOUT') {
      return { success: false, error: 'TIMEOUT' };
    }
    return { success: false, error: 'INTERNAL_ERROR' };
  }
}
