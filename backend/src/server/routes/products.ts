import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  idParamSchema,
  slugParamSchema,
} from "../../schemas/index";

export default async function productRoutes(fastify: FastifyInstance) {
  // GET all products with filtering, sorting, pagination
  fastify.get("/products", async (request, reply) => {
    const query = productQuerySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const where: Record<string, unknown> = {};

    if (!query.all) {
      where.isActive = true;
    }

    if (query.category) {
      (where as { category?: { slug: string } }).category = { slug: query.category };
    }
    if (query.brand) {
      (where as { brand?: { name: string } }).brand = { name: query.brand };
    }
    if (query.search) {
      (where as { OR?: unknown[] }).OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      const price: Record<string, number> = {};
      if (query.minPrice) price.gte = query.minPrice;
      if (query.maxPrice) price.lte = query.maxPrice;
      where.price = price;
    }
    if (query.inStock !== undefined) {
      where.inStock = query.inStock;
    }

    const orderBy: Record<string, string> = { [query.sortBy]: query.sortOrder };

    const [products, total] = await Promise.all([
      fastify.prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
      fastify.prisma.product.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET product by ID
  fastify.get("/products/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const product = await fastify.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: "Product not found",
      });
    }

    return reply.send({ success: true, data: product });
  });

  // GET product by slug
  fastify.get("/products/slug/:slug", async (request, reply) => {
    const { slug } = slugParamSchema.parse(request.params);

    const product = await fastify.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: "Product not found",
      });
    }

    return reply.send({ success: true, data: product });
  });

  // GET related products
  fastify.get("/products/:id/related", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const product = await fastify.prisma.product.findUnique({
      where: { id },
      select: { categoryId: true },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: "Product not found",
      });
    }

    const related = await fastify.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
        isActive: true,
      },
      take: 4,
      orderBy: { rating: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return reply.send({ success: true, data: related });
  });

  // POST create product
  fastify.post(
    "/products",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
    const data = createProductSchema.parse(request.body);

    const [existingSlug, existingSku] = await Promise.all([
      fastify.prisma.product.findUnique({ where: { slug: data.slug } }),
      fastify.prisma.product.findUnique({ where: { sku: data.sku } }),
    ]);

    if (existingSlug) {
      return reply.status(409).send({
        success: false,
        error: "Product with this slug already exists",
      });
    }

    if (existingSku) {
      return reply.status(409).send({
        success: false,
        error: "Product with this SKU already exists",
      });
    }

    const { tags: tagNames, ...productData } = data;

    const product = await fastify.prisma.product.create({
      data: productData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    // Connect tags
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tag = await fastify.prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await fastify.prisma.productTag.create({
          data: { productId: product.id, tagId: tag.id },
        });
      }
    }

    return reply.status(201).send({ success: true, data: product });
    },
  );

  // PUT update product
  fastify.put(
    "/products/:id",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateProductSchema.parse(request.body);

    const existing = await fastify.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Product not found",
      });
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await fastify.prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return reply.status(409).send({
          success: false,
          error: "Product with this slug already exists",
        });
      }
    }

    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await fastify.prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (skuExists) {
        return reply.status(409).send({
          success: false,
          error: "Product with this SKU already exists",
        });
      }
    }

    const { tags: tagNames, ...updateData } = data;

    const product = await fastify.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    // Update tags if provided
    if (tagNames) {
      // Remove existing tags
      await fastify.prisma.productTag.deleteMany({
        where: { productId: id },
      });

      // Add new tags
      for (const tagName of tagNames) {
        const tag = await fastify.prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await fastify.prisma.productTag.create({
          data: { productId: id, tagId: tag.id },
        });
      }
    }

    return reply.send({ success: true, data: product });
    },
  );

  // DELETE product
  fastify.delete(
    "/products/:id",
    { preHandler: [fastify.authenticateAdmin] },
    async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const existing = await fastify.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Product not found",
      });
    }

    await fastify.prisma.product.delete({ where: { id } });

    return reply.send({
      success: true,
      message: "Product deleted successfully",
    });
    },
  );
}
