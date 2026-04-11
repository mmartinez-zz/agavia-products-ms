import { ToolHandler, ToolResult } from "../types";
import prisma from "../prisma";

export const updateProductTool: ToolHandler = async (
  context,
  args,
): Promise<ToolResult> => {
  console.info('[updateProduct] Request', { businessId: context.businessId, args });

  const productId = args.productId;

  // 🔒 VALIDACIÓN
  if (
    typeof productId !== "string") {
    return {
      success: false,
      data: {
        message: "ID de producto inválido",
      },
    };
  }

  const existing = await prisma.product.findFirst({
    where: {
      businessId: context.businessId,
      id: productId,
    },
  });

  if (!existing) {
    return {
      success: false,
      data: {
        message: `No se encontró un producto con ID ${productId}`,
      },
    };
  }

  // 🔧 BUILD UPDATE
  const dataToUpdate: any = {};

  if (typeof args.title === "string" && args.title.trim() !== "") {
    dataToUpdate.title = args.title.trim();
  }

  if (typeof args.price === "number" && args.price > 0) {
    dataToUpdate.price = args.price;
  }

  if (typeof args.description === "string") {
    dataToUpdate.description = args.description;
  }

  if (typeof args.imageUrl === "string" && args.imageUrl.startsWith("http")) {
    dataToUpdate.imageUrl = args.imageUrl;
  }

  // 🔥 NOTHING TO UPDATE
  if (Object.keys(dataToUpdate).length === 0) {
    return {
      success: false,
      data: {
        message: "No se proporcionaron campos para actualizar",
      },
    };
  }

  const updated = await prisma.product.update({
    where: {
      id: existing.id,
    },
    data: dataToUpdate,
  });

  // 🎯 RESPONSE UNIFICADA (MISMO CONTRATO QUE CREATE)
  const result = {
    success: true,
    data: {
      id: updated.id,
      displayId: updated.displayId,
      title: updated.title,
      price: updated.price,
      description: updated.description ?? null,

      ...(updated.imageUrl ? { imageUrl: updated.imageUrl } : {}),

      display: [
        { label: "ID", value: updated.displayId },
        { label: "Título", value: updated.title },
        { label: "Precio", value: `$${updated.price.toLocaleString()}` },
      ],
    },
  };

  console.info('[updateProduct] Response', { success: true, displayId: updated.displayId });
  return result;
};
