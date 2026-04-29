import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { verifyToken } from "@/lib/jwt";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { followUpDate } = body;

    if (!followUpDate)
      return NextResponse.json({ success: false, error: "followUpDate is required" }, { status: 400 });

    await dbConnect();

    const lead = await Lead.findById(id);
    if (!lead)
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    // Agents can only update their own leads
    if (user.role === "agent" && lead.assignedTo?.toString() !== user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    lead.followUpDate = new Date(followUpDate);
    await lead.save(); // triggers pre-save → updates lastActivity

    await Activity.create({
      lead: id,
      action: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString("en-PK")}`,
      performedBy: user.userId,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("[PUT /api/leads/[id]/followup]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
