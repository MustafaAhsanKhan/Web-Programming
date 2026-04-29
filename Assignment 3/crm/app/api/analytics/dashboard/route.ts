import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Basic Counts
    const totalLeads = await Lead.countDocuments();
    
    const overdueFollowupsCount = await Lead.countDocuments({
      followUpDate: { $lt: now, $exists: true },
      status: { $ne: "Closed" }
    });

    const closedThisMonth = await Lead.countDocuments({
      status: "Closed",
      updatedAt: { $gte: startOfMonth }
    });

    const highPriority = await Lead.countDocuments({ score: 3 });

    // 2. Leads by Status & Priority (Aggregation)
    const statusAgg = await Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const leadsByStatus = {
      New: 0, Contacted: 0, "In Progress": 0, Closed: 0
    };
    statusAgg.forEach((s) => {
      if (s._id in leadsByStatus) leadsByStatus[s._id as keyof typeof leadsByStatus] = s.count;
    });

    const priorityAgg = await Lead.aggregate([
      { $group: { _id: "$score", count: { $sum: 1 } } }
    ]);
    const leadsByPriority = { High: 0, Medium: 0, Low: 0 };
    priorityAgg.forEach((p) => {
      if (p._id === 3) leadsByPriority.High = p.count;
      if (p._id === 2) leadsByPriority.Medium = p.count;
      if (p._id === 1) leadsByPriority.Low = p.count;
    });

    // 3. Agent Performance (Aggregation)
    const agentAgg = await Lead.aggregate([
      { $match: { assignedTo: { $exists: true, $ne: null } } },
      { 
        $group: { 
          _id: "$assignedTo", 
          totalAssigned: { $sum: 1 },
          closedCount: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
          inProgressCount: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
        } 
      }
    ]);
    
    // Fetch Agent names
    const agentPerformance = [];
    for (const agentData of agentAgg) {
      const agentUser = await User.findById(agentData._id).lean();
      if (agentUser) {
        agentPerformance.push({
          agentName: agentUser.name,
          totalAssigned: agentData.totalAssigned,
          closedCount: agentData.closedCount,
          inProgressCount: agentData.inProgressCount,
        });
      }
    }

    // Sort by most closed leads
    agentPerformance.sort((a, b) => b.closedCount - a.closedCount);

    // 4. Leads created over last 7 days (Line Chart Data)
    const leadsByDateAgg = await Lead.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing dates for the last 7 days
    const leadsByDate = [];
    for (let i = 0; i <= 6; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const found = leadsByDateAgg.find((item) => item._id === dateStr);
      leadsByDate.push({
        date: dateStr,
        displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: found ? found.count : 0
      });
    }

    // 5. Recent Leads
    const recentLeads = await Lead.find()
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        highPriority,
        overdueFollowupsCount,
        closedThisMonth,
        leadsByStatus,
        leadsByPriority,
        agentPerformance,
        leadsByDate,
        recentLeads
      }
    });

  } catch (error: any) {
    console.error("[GET /api/analytics/dashboard]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
