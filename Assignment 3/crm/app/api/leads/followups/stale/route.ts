import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { withMiddleware } from "@/lib/api-middleware";

export const dynamic = "force-dynamic";

const STALE_DAYS = 7;

export const GET = withMiddleware(
  async (request) => {
    await dbConnect();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - STALE_DAYS);

    const filter: Record<string, any> = {
      status: { $ne: "Closed" },
      lastActivity: { $lt: cutoff },
    };

    if (request.user.role === "agent") {
      filter.assignedTo = request.user.userId;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ lastActivity: 1 })
      .lean();

    return NextResponse.json({ success: true, leads, count: leads.length, staleDays: STALE_DAYS });
  },
  { requireAuth: true }
);
