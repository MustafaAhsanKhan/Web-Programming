import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { withMiddleware } from "@/lib/api-middleware";

export const GET = withMiddleware(
  async (request) => {
    await dbConnect();
    const user = await User.findById(request.user.userId).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  },
  { requireAuth: true }
);
