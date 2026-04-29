import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { ZodSchema } from "zod";

// Simple in-memory rate limit store
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

// Cleanup stale entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.expiresAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

interface MiddlewareOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  schema?: ZodSchema;
  isPublicRateLimit?: boolean; // strictly 10/min
}

export function withMiddleware(
  handler: (req: AuthenticatedRequest, context: any) => Promise<NextResponse>,
  options?: MiddlewareOptions
) {
  return async (req: AuthenticatedRequest, context: any) => {
    try {
      // 1. Authentication & Role Authorization
      if (options?.requireAuth || options?.requireAdmin) {
        const token = req.cookies.get("crm_token")?.value;
        if (!token) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        
        const user = await verifyToken(token);
        if (!user) {
          return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
        }

        if (options.requireAdmin && user.role !== "admin") {
          return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
        }

        req.user = user;
      }

      // 2. Rate Limiting
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const key = `${ip}`;
      const now = Date.now();
      
      let limit = 10; // Default fallback
      if (req.user) {
        limit = req.user.role === "admin" ? 200 : 50;
      } else if (options?.isPublicRateLimit) {
        limit = 10;
      }

      const rateData = rateLimitMap.get(key) || { count: 0, expiresAt: now + 60 * 1000 };
      
      if (now > rateData.expiresAt) {
        rateData.count = 0;
        rateData.expiresAt = now + 60 * 1000;
      }

      if (rateData.count >= limit) {
        return NextResponse.json(
          { success: false, error: "Too Many Requests" }, 
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      
      rateData.count += 1;
      rateLimitMap.set(key, rateData);

      // 3. Request Validation (for POST/PUT)
      if (options?.schema && ["POST", "PUT", "PATCH"].includes(req.method)) {
        try {
          const body = await req.clone().json();
          options.schema.parse(body);
        } catch (err: any) {
          return NextResponse.json(
            { success: false, error: "Validation failed", details: err.errors }, 
            { status: 400 }
          );
        }
      }

      // 4. Execute Route Handler
      return await handler(req, context);

    } catch (error: any) {
      console.error("[API Middleware Error]", error);
      return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
  };
}
