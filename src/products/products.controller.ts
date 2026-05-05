import { Controller, Post, Body, Get } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ToolsService } from '../tools/tools.service';
import { ExecuteRequest, ToolResult } from '../common/types';
import { Logger } from '@nestjs/common';

const logger = new Logger('ProductsController');

@Controller()
export class ProductsController {
  private readonly logger = new Logger('ProductsController');
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
    logger.log('[execute] Request', {
      tool: body.tool,
      businessId: body.context?.businessId,
      args: body.args,
    });

    if (!body.tool || typeof body.tool !== 'string') {
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    if (!body.args || typeof body.args !== 'object') {
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    if (!body.context || typeof body.context !== 'object' || !body.context.businessId) {
      return { success: false, error: 'VALIDATION_ERROR' };
    }

    logger.debug('[execute] Request validated', {
      tool: body.tool,
      businessId: body.context.businessId,
    });

    const result = await this.toolsService.execute(body.tool, body.context, body.args);

    logger.log('[execute] Response', {
      tool: body.tool,
      success: result?.success,
    });

    return result;
  }
}
