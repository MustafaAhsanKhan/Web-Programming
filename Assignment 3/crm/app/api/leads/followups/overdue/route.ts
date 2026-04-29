import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const now = new Date();

    // Base filter: not closed, follow-up date has passed
    const filter: Record<string, any> = {
      followUpDate: { $lt: now, $exists: true },
      status: { $ne: "Closed" },
    };

    // Agents only see their own leads
    if (user.role === "agent") {
      filter.assignedTo = user.userId;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ followUpDate: 1 })
      .lean();

    return NextResponse.json({ success: true, leads, count: leads.length });
  } catch (error: any) {
    console.error("[GET /api/leads/followups/overdue]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
