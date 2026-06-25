import type { FastifyInstance } from "fastify";
import healthRoutes from "./health";
import authRoutes from "./auth";
import categoryRoutes from "./categories";
import productRoutes from "./products";
import brandRoutes from "./brands";
import bannerRoutes from "./banners";
import blogPostRoutes from "./blogPosts";
import testimonialRoutes from "./testimonials";
import galleryImageRoutes from "./galleryImages";

export default async function apiRoutes(fastify: FastifyInstance) {
  fastify.register(healthRoutes, { prefix: "/api" });
  fastify.register(authRoutes, { prefix: "/api" });
  fastify.register(categoryRoutes, { prefix: "/api" });
  fastify.register(productRoutes, { prefix: "/api" });
  fastify.register(brandRoutes, { prefix: "/api" });
  fastify.register(bannerRoutes, { prefix: "/api" });
  fastify.register(blogPostRoutes, { prefix: "/api" });
  fastify.register(testimonialRoutes, { prefix: "/api" });
  fastify.register(galleryImageRoutes, { prefix: "/api" });
}
