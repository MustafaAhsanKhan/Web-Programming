import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { withMiddleware } from "@/lib/api-middleware";
import { leadFollowupSchema } from "@/lib/schemas";

export const PUT = withMiddleware(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.clone().json();
    const { followUpDate } = body;

    await dbConnect();

    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    if (request.user.role === "agent" && lead.assignedTo?.toString() !== request.user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    lead.followUpDate = new Date(followUpDate);
    await lead.save();

    await Activity.create({
      lead: id,
      action: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString("en-PK")}`,
      performedBy: request.user.userId,
    });

    return NextResponse.json({ success: true, lead });
  },
  { requireAuth: true, schema: leadFollowupSchema }
);
