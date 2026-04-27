import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ─── TypeScript Interface ────────────────────────────────
export interface IActivity extends Document {
  lead: Types.ObjectId;
  action: string;
  performedBy: Types.ObjectId;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema Definition ──────────────────────────────────
const ActivitySchema = new Schema<IActivity>(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: [true, "Lead reference is required"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performer reference is required"],
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes for efficient timeline queries ─────────────
ActivitySchema.index({ lead: 1, createdAt: -1 });
ActivitySchema.index({ performedBy: 1, createdAt: -1 });

// ─── Prevent model recompilation on HMR ─────────────────
const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
