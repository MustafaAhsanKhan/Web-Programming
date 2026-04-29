import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { withMiddleware } from "@/lib/api-middleware";
import { registerSchema } from "@/lib/schemas";

export const POST = withMiddleware(
  async (request) => {
    const body = await request.clone().json();
    const { name, email, password, role } = body;

    await dbConnect();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role === "admin" ? "admin" : "agent",
    });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: { _id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );

    response.cookies.set("crm_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  },
  {
    schema: registerSchema,
    isPublicRateLimit: true,
  }
);
