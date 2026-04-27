import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User"; // required for population
import { verifyToken } from "@/lib/jwt";
import { updateLeadAdminSchema, updateLeadAgentSchema } from "@/lib/validations/lead";

async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("crm_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15 app router, params should be awaited if we use dynamic routes
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findById(id).populate("assignedTo", "name email");

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Agent can only view if assigned to them
    if (user.role === "agent" && lead.assignedTo?._id.toString() !== user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not assigned to this lead" }, { status: 403 });
    }

    // Fetch activities for this lead
    const activities = await Activity.find({ lead: id })
      .populate("performedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      lead,
      activities
    });

  } catch (error: any) {
    console.error("[GET /api/leads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Agent check
    if (user.role === "agent" && lead.assignedTo?.toString() !== user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not assigned to this lead" }, { status: 403 });
    }

    const body = await request.json();
    
    // Choose validation schema based on role
    const schema = user.role === "admin" ? updateLeadAdminSchema : updateLeadAgentSchema;
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: result.error.errors 
      }, { status: 400 });
    }

    const updates = result.data;

    // Track changes for activity log
    const activitiesToLog = [];

    if (updates.status && updates.status !== lead.status) {
      activitiesToLog.push({
        lead: id,
        action: `Status changed from ${lead.status} to ${updates.status}`,
        performedBy: user.userId
      });
    }

    if (user.role === "admin" && updates.assignedTo !== undefined) {
      // Check if assignedTo actually changed
      const oldAssignedTo = lead.assignedTo?.toString() || null;
      const newAssignedTo = updates.assignedTo || null;
      
      if (oldAssignedTo !== newAssignedTo) {
        let assignedAgentName = "Unassigned";
        if (newAssignedTo) {
          const agent = await User.findById(newAssignedTo).select("name");
          if (agent) assignedAgentName = agent.name;
        }
        
        activitiesToLog.push({
          lead: id,
          action: `Assigned to ${assignedAgentName}`,
          performedBy: user.userId
        });
      }
    }

    // Apply updates
    Object.assign(lead, updates);
    
    // Save lead (triggers pre-save hooks like score calculation)
    await lead.save();

    // Save activities
    if (activitiesToLog.length > 0) {
      await Activity.insertMany(activitiesToLog);
    }

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      lead
    });

  } catch (error: any) {
    console.error("[PUT /api/leads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Delete associated activities
    await Activity.deleteMany({ lead: id });

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully"
    });

  } catch (error: any) {
    console.error("[DELETE /api/leads/[id]]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
