import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ success: false }, { status: 403 });
    }
    
    await dbConnect();
    const agents = await User.find({ role: "agent" }).select("name email").sort({ name: 1 });
    
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
