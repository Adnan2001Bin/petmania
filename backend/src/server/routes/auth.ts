import type { FastifyInstance } from "fastify";
import "../../types/fastify.d";
import bcrypt from "bcryptjs";
import {
  createUserSchema,
  loginSchema,
} from "../../schemas/index";

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post("/auth/register", async (request, reply) => {
    const data = createUserSchema.parse(request.body);

    // Check if user already exists
    const existing = await fastify.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await fastify.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || "USER",
        avatar: data.avatar,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.status(201).send({
      success: true,
      data: { user, token },
    });
  });

  // POST /api/auth/login
  fastify.post("/auth/login", async (request, reply) => {
    const data = loginSchema.parse(request.body);

    // Find user
    const user = await fastify.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return reply.status(403).send({
        success: false,
        error: "Account is deactivated. Contact support.",
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return reply.status(401).send({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate token
    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
        token,
      },
    });
  });

  // GET /api/auth/profile (requires authentication)
  fastify.get(
    "/auth/profile",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({ success: true, data: user });
    }
  );

  // PUT /api/auth/profile (requires authentication)
  fastify.put(
    "/auth/profile",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const { name, phone, avatar } = request.body as {
        name?: string;
        phone?: string;
        avatar?: string;
      };

      const user = await fastify.prisma.user.update({
        where: { id: userId },
        data: { name, phone, avatar },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          phone: true,
        },
      });

      return reply.send({ success: true, data: user });
    }
  );

  // POST /api/auth/change-password (requires authentication)
  fastify.post(
    "/auth/change-password",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const { currentPassword, newPassword } = request.body as {
        currentPassword: string;
        newPassword: string;
      };

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: "User not found",
        });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return reply.status(400).send({
          success: false,
          error: "Current password is incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await fastify.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return reply.send({
        success: true,
        message: "Password changed successfully",
      });
    }
  );
}
