import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { withMiddleware } from "@/lib/api-middleware";
// @ts-ignore
import * as XLSX from "xlsx";
// @ts-ignore
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export const GET = withMiddleware(
  async (request) => {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    if (!format || !["excel", "pdf"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Invalid format. Use ?format=excel or ?format=pdf" },
        { status: 400 }
      );
    }

    const query: any = {};
    if (request.user.role === "agent") {
      query.assignedTo = request.user.userId;
    }

    const leads = await Lead.find(query)
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .lean();

    if (format === "excel") {
      const data = leads.map((lead: any) => ({
        Name: lead.name,
        Email: lead.email,
        Phone: lead.phone,
        Status: lead.status,
        Priority: lead.score === 3 ? "High" : lead.score === 2 ? "Medium" : "Low",
        Budget: lead.budget,
        Source: lead.source || "N/A",
        "Assigned Agent": lead.assignedTo ? lead.assignedTo.name : "Unassigned",
        "Created At": new Date(lead.createdAt).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        headers: {
          "Content-Disposition": 'attachment; filename="propertycrm_leads.xlsx"',
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];
      
      doc.on("data", buffers.push.bind(buffers));
      
      return new Promise((resolve) => {
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(
            new NextResponse(pdfData, {
              headers: {
                "Content-Disposition": 'attachment; filename="propertycrm_leads.pdf"',
                "Content-Type": "application/pdf",
              },
            })
          );
        });

        // ── Generate PDF Content ──
        doc.fontSize(22).fillColor("#0f172a").text("PropertyCRM Leads Report", { align: "center", underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor("#64748b").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown(2);

        leads.forEach((lead: any, idx) => {
          doc.fontSize(12).fillColor("#0f172a").font("Helvetica-Bold").text(`${idx + 1}. ${lead.name}`);
          
          doc.fontSize(10).font("Helvetica").fillColor("#334155")
            .text(`Email: ${lead.email} | Phone: ${lead.phone}`);
            
          const priority = lead.score === 3 ? 'High' : lead.score === 2 ? 'Medium' : 'Low';
          doc.text(`Status: ${lead.status} | Priority: ${priority}`);
          
          const agentName = lead.assignedTo ? lead.assignedTo.name : "Unassigned";
          doc.text(`Budget: Rs. ${lead.budget} | Agent: ${agentName}`);
          
          doc.moveDown();
          
          // Add a subtle line separator between records unless it's the last one
          if (idx < leads.length - 1) {
            doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor("#e2e8f0").stroke();
            doc.moveDown();
          }
        });

        doc.end();
      });
    }

    return NextResponse.json({ success: false, error: "Unexpected error" }, { status: 500 });
  },
  { requireAuth: true }
);
