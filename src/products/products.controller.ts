import { Controller, Post, Body, Get } from '@nestjs/common';
import { logger } from '@mmartinez-zz/agavia-observability';
import { ProductsService } from './products.service';
import { ToolsService } from '../tools/tools.service';
import { ExecuteRequest, ToolResult } from '../common/types';

@Controller()
export class ProductsController {

  constructor(
    private readonly productsService: ProductsService,
    private readonly toolsService: ToolsService,
  ) {}

  @Get('/health')
  async health() {
    return { status: 'ok' };
  }

  @Post('/execute')
  async execute(@Body() body: ExecuteRequest): Promise<ToolResult> {
    if (!body.tool || typeof body.tool !== 'string') {
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    if (!body.args || typeof body.args !== 'object') {
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    if (!body.context || typeof body.context !== 'object' || !body.context.businessId) {
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    const result = await this.toolsService.execute(body.tool, body.context, body.args);

    logger.log({
      event: 'tool_invoked',
      tool: body.tool,
      businessId: body.context.businessId,
      success: result?.success,
    });

    return result;
  }
}
