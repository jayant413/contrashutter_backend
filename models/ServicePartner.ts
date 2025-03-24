import mongoose, { Schema, Document } from "mongoose";

interface IServicePartner extends Document {
  name: string;
  registrationNumber: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  businessAddress: string;
  employees: string;
  experience: string;
  projects: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  partner: mongoose.Types.ObjectId;
  status: "Pending" | "Active" | "Inactive";
}

const ServicePartnerSchema: Schema = new Schema(
  {
    name: { type: String },
    registrationNumber: { type: String },
    contactPerson: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    businessAddress: { type: String },
    employees: { type: String },
    experience: { type: String },
    projects: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Inactive"],
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "servicepartners",
  }
);

const ServicePartner =
  mongoose.models.ServicePartner ||
  mongoose.model<IServicePartner>("ServicePartner", ServicePartnerSchema);

export default ServicePartner;
