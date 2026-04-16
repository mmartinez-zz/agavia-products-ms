import prisma from '../prisma';

export interface CreateProductData {
  businessId: string;
  title: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  keywords?: string[];
}

export async function createProduct(data: CreateProductData) {
  const last = await prisma.product.findFirst({
    where: { businessId: data.businessId },
    orderBy: { displayId: 'desc' },
  });

  const nextDisplayId = (last?.displayId || 0) + 1;

  const normalizedKeywords = (data.keywords || [])
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 2);

  return prisma.product.create({
    data: {
      businessId: data.businessId,
      displayId: nextDisplayId,
      title: data.title,
      description: data.description ?? undefined,
      price: data.price ?? 0,
      imageUrl: data.imageUrl ?? undefined,
      sourceUrl: data.sourceUrl ?? undefined,
      sourceType: data.sourceType ?? undefined,
      keywords: normalizedKeywords,
    },
  });
}
