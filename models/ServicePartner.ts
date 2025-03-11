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
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    contactPerson: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    businessAddress: { type: String, required: true },
    employees: { type: String, required: true },
    experience: { type: String, required: true },
    projects: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, required: true },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
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

// Add better error handling for duplicate key errors
ServicePartnerSchema.post(
  "save",
  function (error: mongoose.Error, next: (err?: Error) => void) {
    next(error);
  }
);

const ServicePartner =
  mongoose.models.ServicePartner ||
  mongoose.model<IServicePartner>("ServicePartner", ServicePartnerSchema);

export default ServicePartner;
