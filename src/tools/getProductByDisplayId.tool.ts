import { ToolHandler, ToolResult } from "../types";
import prisma from "../prisma";

export const getProductByDisplayIdTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  const displayId = args.displayId;

  if (
    typeof displayId !== "number" ||
    !Number.isInteger(displayId) ||
    displayId <= 0
  ) {
    return {
      success: false,
      data: {
        message: `El dato que ingresaste es incorrecto.`,
      },
    };
  }

  const product = await prisma.product.findFirst({
    where: {
      businessId: context.businessId,
      displayId,
    },
  });

  if (!product) {
    return {
      success: false,
      data: {
        message: `No se encontró un producto con ID ${displayId}`,
      },
    };
  }

  return {
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
      ],
      imageUrl: product.imageUrl || null,
    },
  };
};
