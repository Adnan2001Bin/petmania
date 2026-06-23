import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  paginationSchema,
  idParamSchema,
  slugParamSchema,
} from "../../schemas/index";

export default async function blogPostRoutes(fastify: FastifyInstance) {
  // GET all blog posts
  fastify.get("/blog-posts", async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const [posts, total] = await Promise.all([
      fastify.prisma.blogPost.findMany({
        skip,
        take: query.limit,
        orderBy: { date: "desc" },
      }),
      fastify.prisma.blogPost.count(),
    ]);

    return reply.send({
      success: true,
      data: posts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  });

  // GET blog post by ID
  fastify.get("/blog-posts/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const post = await fastify.prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return reply.status(404).send({
        success: false,
        error: "Blog post not found",
      });
    }

    return reply.send({ success: true, data: post });
  });

  // GET blog post by slug
  fastify.get("/blog-posts/slug/:slug", async (request, reply) => {
    const { slug } = slugParamSchema.parse(request.params);

    const post = await fastify.prisma.blogPost.findUnique({ where: { slug } });

    if (!post) {
      return reply.status(404).send({
        success: false,
        error: "Blog post not found",
      });
    }

    return reply.send({ success: true, data: post });
  });

  // POST create blog post
  fastify.post("/blog-posts", async (request, reply) => {
    const data = createBlogPostSchema.parse(request.body);

    const existing = await fastify.prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: "Blog post with this slug already exists",
      });
    }

    const post = await fastify.prisma.blogPost.create({
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      },
    });

    return reply.status(201).send({ success: true, data: post });
  });

  // PUT update blog post
  fastify.put("/blog-posts/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateBlogPostSchema.parse(request.body);

    const existing = await fastify.prisma.blogPost.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Blog post not found",
      });
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await fastify.prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return reply.status(409).send({
          success: false,
          error: "Blog post with this slug already exists",
        });
      }
    }

    const post = await fastify.prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      },
    });

    return reply.send({ success: true, data: post });
  });

  // DELETE blog post
  fastify.delete("/blog-posts/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);

    const existing = await fastify.prisma.blogPost.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Blog post not found",
      });
    }

    await fastify.prisma.blogPost.delete({ where: { id } });

    return reply.send({
      success: true,
      message: "Blog post deleted successfully",
    });
  });
}
