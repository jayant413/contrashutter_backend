import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  fullname: string;
  contact: string;
  email: string;
  password: string;
  role: "Service Provider" | "Client" | "Admin";
  status: "Pending" | "Active" | "Inactive";
  dateOfBirth?: string;
  aadharCard?: string;
  panCard?: string;
  address?: string;
  profileImage?: string;
  coverImage?: string;
  notifications: Array<{
    _id?: mongoose.Types.ObjectId;
    title: string;
    message: string;
    redirectPath: string;
    sender: mongoose.Types.ObjectId;
    createdAt?: Date;
    read?: boolean;
  }>;
  wishlist: mongoose.Types.ObjectId[]; // Changed to array of ids
  partnerId: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUser>({
  fullname: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Active", "Inactive"],
    required: false,
  },
  role: {
    type: String,
    required: true,
    enum: ["Service Provider", "Client", "Admin"],
    default: "Client",
  },
  dateOfBirth: { type: String },
  aadharCard: { type: String },
  panCard: { type: String },
  address: { type: String },
  profileImage: { type: String },
  coverImage: { type: String },
  notifications: [
    {
      title: { type: String },
      message: { type: String },
      redirectPath: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePartner" },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Package" }], // Changed to array of ids
});

// Middleware to check notifications length
userSchema.pre("save", function (next) {
  if (this.notifications.length > 100) {
    this.notifications = this.notifications.slice(0, 80); // Keep the newest 80 notifications
  }
  next();
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
