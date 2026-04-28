import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { verifyToken } from "@/lib/jwt";
import { createLeadSchema } from "@/lib/validations/lead";

// Helper to get authenticated user from request
async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("crm_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate with Zod
    const result = createLeadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: result.error.issues 
      }, { status: 400 });
    }

    await dbConnect();
    
    // Check if lead with email exists
    const existingLead = await Lead.findOne({ email: result.data.email });
    if (existingLead) {
      return NextResponse.json({ success: false, error: "A lead with this email already exists" }, { status: 409 });
    }

    const createData: any = { ...result.data };
    if (!createData.assignedTo) delete createData.assignedTo;
    if (!createData.followUpDate) delete createData.followUpDate;

    // Create the lead
    const newLead = await Lead.create(createData);

    // Log the creation activity
    await Activity.create({
      lead: newLead._id,
      action: "Lead created",
      performedBy: user.userId,
      details: result.data.assignedTo ? `Created and assigned.` : "Created lead.",
    });

    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      lead: newLead
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("[POST /api/leads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const score = searchParams.get("score");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    // Build the query
    const query: any = {};

    // Role-based restrictions
    if (user.role === "agent") {
      // Agents can only see leads assigned to them
      query.assignedTo = user.userId;
    } else if (assignedTo) {
      // Admins can filter by assignedTo
      query.assignedTo = assignedTo === "unassigned" ? null : assignedTo;
    }

    if (status) query.status = status;
    if (score) query.score = Number(score);

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 }) // Newest first
      .exec();

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads
    });

  } catch (error: any) {
    console.error("[GET /api/leads]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
