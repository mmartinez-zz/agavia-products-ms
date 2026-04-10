import { ToolHandler, ToolResult } from "../types";
import prisma from "../prisma";
import { Prisma } from "@prisma/client";

function buildDateFilter(
  dateFrom?: string,
  dateTo?: string,
): { gte?: Date; lte?: Date } | null {
  const from = parseISODate(dateFrom);
  const to = parseISODate(dateTo);

  if (!from && !to) return null;
  if (from && to && from > to) return null;

  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = from;
  if (to) filter.lte = to;

  return filter;
}

function parseISODate(value?: string): Date | null {
  if (!value) return null;

  const date = new Date(value);

  if (isNaN(date.getTime())) return null;

  return date;
}

export const listProductsTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  const limit = Math.min(args.limit || 10, 50);
  const offset = Math.max(args.offset || 0, 0);
  const filters = args.filters || {};
  const text: string | undefined = filters.text?.trim();
  const businessId = context.businessId;

  const dateFilter = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Prisma.ProductWhereInput = {
    businessId,
    ...(dateFilter && { createdAt: dateFilter }),
    ...(text && {
      OR: [
        { title: { contains: text, mode: "insensitive" } },
        { description: { contains: text, mode: "insensitive" } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where }),
  ]);

  const result = products.map((p) => ({
    displayId: p.displayId,
    title: p.title,
    price: p.price,
    imageUrl: p.imageUrl || null,
    createdAt: p.createdAt.toISOString(),
  }));

  const display = result.map((p) => ({
    label: `${p.displayId}. ${p.title}`,
    value: `$${p.price}`,
  }));

  const hasMore = offset + result.length < total;

  return {
    success: true,
    data: {
      products: result,
      count: result.length,
      total,
      limit,
      offset,
      hasMore,
      display,
      ...(result.length === 1 && result[0].imageUrl
        ? { imageUrl: result[0].imageUrl }
        : {}),
    },
  };
};

