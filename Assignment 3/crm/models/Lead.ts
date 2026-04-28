import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ─── TypeScript Interface ────────────────────────────────
export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  status: "New" | "Contacted" | "In Progress" | "Closed";
  notes: string;
  assignedTo?: Types.ObjectId;
  score: number; // 1 = Low, 2 = Medium, 3 = High
  followUpDate?: Date;
  lastActivity: Date;
  source?: "facebook" | "website" | "walk-in" | "referral" | "other";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema Definition ──────────────────────────────────
const LeadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, "Lead name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    propertyInterest: {
      type: String,
      trim: true,
      default: "",
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: [0, "Budget cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["New", "Contacted", "In Progress", "Closed"],
        message: "Status must be New, Contacted, In Progress, or Closed",
      },
      default: "New",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    score: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["facebook", "website", "walk-in", "referral", "other"],
      default: "other",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save: Auto Lead Scoring based on budget (PKR) ──
//   Budget > 20M   → score 3 (High Priority)
//   Budget 10M–20M → score 2 (Medium Priority)
//   Budget < 10M   → score 1 (Low Priority)
LeadSchema.pre("save", function () {
  if (this.isModified("budget")) {
    if (this.budget > 20_000_000) {
      this.score = 3;
    } else if (this.budget >= 10_000_000) {
      this.score = 2;
    } else {
      this.score = 1;
    }
  }

  // Refresh lastActivity on every save
  this.lastActivity = new Date();
});

// ─── Indexes ────────────────────────────────────────────
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ score: -1, createdAt: -1 });
LeadSchema.index({ followUpDate: 1 });
LeadSchema.index({ email: 1 });

// ─── Prevent model recompilation on HMR ─────────────────
const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
