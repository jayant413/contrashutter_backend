import mongoose, { Document, Schema } from "mongoose";

export interface ISupportTicket extends Document {
  subject: string;
  message: string;
  priority: "Low" | "Medium" | "High";
  userId: mongoose.Types.ObjectId;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    subject: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
      default: "Low",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    image: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model<ISupportTicket>(
  "SupportTicket",
  supportTicketSchema
);
export default SupportTicket;
