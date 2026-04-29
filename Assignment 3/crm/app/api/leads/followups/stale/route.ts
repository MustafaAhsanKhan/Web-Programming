import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const STALE_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - STALE_DAYS);

    // Leads not closed AND lastActivity hasn't been updated in 7 days
    const filter: Record<string, any> = {
      status: { $ne: "Closed" },
      lastActivity: { $lt: cutoff },
    };

    // Agents only see their own leads
    if (user.role === "agent") {
      filter.assignedTo = user.userId;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ lastActivity: 1 }) // oldest activity first
      .lean();

    return NextResponse.json({ success: true, leads, count: leads.length, staleDays: STALE_DAYS });
  } catch (error: any) {
    console.error("[GET /api/leads/followups/stale]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
