import express, { Request, Response } from 'express';
import prisma from './prisma';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

interface ExecuteRequest {
  tool: string;
  businessId: string;
  args: {
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  };
}

app.post('/execute', async (req: Request, res: Response) => {
  const body: ExecuteRequest = req.body;

  // Validate tool name
  if (body.tool !== 'create_product_from_chat') {
    return res.status(400).json({ success: false, error: 'UNKNOWN_TOOL' });
  }

  // Validate businessId
  if (!body.businessId || typeof body.businessId !== 'string') {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR' });
  }

  const { title, description, price, imageUrl } = body.args || {};

  // Validate title
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR' });
  }

  // Validate price
  if (price === undefined || typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR' });
  }

  // Validate imageUrl
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description || null,
        price,
        imageUrl,
        businessId: body.businessId,
      },
    });

    return res.json({
      success: true,
      data: {
        id: product.id,
        title: product.title,
      },
    });
  } catch (error: any) {
    console.error(`[create_product_from_chat] Error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.listen(PORT, () => {
  console.log(`[tool-create-product] Running on port ${PORT}`);
});
