import { Router, Request, Response } from 'express';
import { ExecuteRequest } from '../types';
import { executeTool } from '../services/tool.service';

const router = Router();

router.post('/execute', async (req: Request, res: Response) => {
  const body: ExecuteRequest = req.body;

  console.log('[TOOL-MS] Incoming request', {
    tool: body.tool,
    businessId: body.context?.businessId,
    hasArgs: !!body.args,
    argsKeys: body.args ? Object.keys(body.args) : []
  });

  if (!body.tool || typeof body.tool !== 'string') {
    return res.json({ success: false, error: 'VALIDATION_ERROR' });
  }

  if (!body.args || typeof body.args !== 'object') {
    return res.json({ success: false, error: 'VALIDATION_ERROR' });
  }

  if (!body.context || typeof body.context !== 'object' || !body.context.businessId) {
    return res.json({ success: false, error: 'VALIDATION_ERROR' });
  }

  console.log('[TOOL-MS] Request validated', {
    tool: body.tool,
    businessId: body.context.businessId
  });

  const result = await executeTool(body.tool, body.context, body.args);

  console.log('[TOOL-MS] Execution result', {
    tool: body.tool,
    success: result?.success,
    hasData: !!result?.data
  });

  return res.json(result);
});

export default router;
