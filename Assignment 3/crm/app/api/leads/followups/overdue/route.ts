import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { withMiddleware } from "@/lib/api-middleware";

export const dynamic = "force-dynamic";

export const GET = withMiddleware(
  async (request) => {
    await dbConnect();
    const now = new Date();

    const filter: Record<string, any> = {
      followUpDate: { $lt: now, $exists: true },
      status: { $ne: "Closed" },
    };

    if (request.user.role === "agent") {
      filter.assignedTo = request.user.userId;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .sort({ followUpDate: 1 })
      .lean();

    return NextResponse.json({ success: true, leads, count: leads.length });
  },
  { requireAuth: true }
);
