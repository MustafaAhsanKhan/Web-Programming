import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { withMiddleware } from "@/lib/api-middleware";
import { loginSchema } from "@/lib/schemas";

export const POST = withMiddleware(
  async (request) => {
    const body = await request.clone().json();
    const { email, password } = body;

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: { _id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });

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
    schema: loginSchema,
    isPublicRateLimit: true,
  }
);
