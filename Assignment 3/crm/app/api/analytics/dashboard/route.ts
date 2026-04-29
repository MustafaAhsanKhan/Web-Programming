import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { withMiddleware } from "@/lib/api-middleware";

export const dynamic = "force-dynamic";

export const GET = withMiddleware(
  async () => {
    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

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

    agentPerformance.sort((a, b) => b.closedCount - a.closedCount);

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
  },
  { requireAdmin: true }
);
