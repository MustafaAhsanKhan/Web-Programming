import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { withMiddleware } from "@/lib/api-middleware";

export const GET = withMiddleware(
  async () => {
    await dbConnect();
    const agents = await User.find({ role: "agent" }).select("name email").sort({ name: 1 });
    return NextResponse.json({ success: true, agents });
  },
  { requireAdmin: true }
);
