import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { createLeadSchema } from "@/lib/validations/lead";
import { broadcastSseEvent } from "@/lib/sse";
import { sendNewLeadEmail } from "@/lib/email";
import { withMiddleware } from "@/lib/api-middleware";

export const POST = withMiddleware(
  async (request) => {
    // The request body is already validated by withMiddleware using createLeadSchema
    const body = await request.clone().json();

    await dbConnect();

    // Check if lead with email exists
    const existingLead = await Lead.findOne({ email: body.email });
    if (existingLead) {
      return NextResponse.json({ success: false, error: "A lead with this email already exists" }, { status: 409 });
    }

    const createData: any = { ...body };
    if (!createData.assignedTo) delete createData.assignedTo;
    if (!createData.followUpDate) delete createData.followUpDate;

    // Create the lead
    const newLead = await Lead.create(createData);

    // Log the creation activity
    await Activity.create({
      lead: newLead._id,
      action: "Lead created",
      performedBy: request.user.userId,
      details: body.assignedTo ? `Created and assigned.` : "Created lead.",
    });

    // Notify all connected browsers in real-time (non-blocking)
    broadcastSseEvent("new_lead", { lead: newLead });

    // Email every admin account (using the email they signed up with) — fire-and-forget
    User.find({ role: "admin" }, "email").lean().then((admins: any[]) => {
      const adminEmails = admins.map((a) => a.email).filter(Boolean);
      sendNewLeadEmail(
        {
          _id: newLead._id?.toString(),
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          budget: newLead.budget,
          propertyInterest: newLead.propertyInterest,
          source: newLead.source,
          score: newLead.score,
        },
        adminEmails
      );
    }).catch((err: any) => console.error("[POST /api/leads] Failed to fetch admin emails:", err));

    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      lead: newLead
    }, { status: 201 });
  },
  { requireAdmin: true, schema: createLeadSchema }
);

export const GET = withMiddleware(
  async (request) => {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const score = searchParams.get("score");
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");

    // Build the query
    const query: any = {};

    // Role-based restrictions
    if (request.user.role === "agent") {
      // Agents can only see leads assigned to them
      query.assignedTo = request.user.userId;
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
  },
  { requireAuth: true }
);
