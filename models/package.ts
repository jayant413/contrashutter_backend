import mongoose, { Schema, Document } from "mongoose";

// Interface for Card Details
interface ICardDetail {
  product_name: string;
  quantity: number;
}

// Interface for Package Details
interface IPackageDetail {
  title: string;
  subtitles: string[];
}

// Interface for Bill Details
interface IBillDetail {
  type: string;
  amount: number;
}

// Interface for Package Document
export interface IPackage extends Document {
  serviceId: mongoose.Schema.Types.ObjectId;
  eventId: mongoose.Schema.Types.ObjectId;
  name: string;
  price: number;
  booking_price: number;
  card_details: ICardDetail[];
  package_details: IPackageDetail[];
  bill_details: IBillDetail[];
  category: string;
}

// Package Schema
const PackageSchema = new Schema<IPackage>({
  serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
  eventId: { type: Schema.Types.ObjectId, ref: "Event" },
  name: { type: String },
  price: { type: Number },
  booking_price: { type: Number },
  card_details: [
    {
      product_name: { type: String },
      quantity: { type: Number },
    },
  ],
  package_details: [
    {
      title: { type: String },
      subtitles: [{ type: String }],
    },
  ],
  bill_details: [
    {
      type: { type: String },
      amount: { type: Number },
    },
  ],
  category: { type: String },
});

// Export the Package model
export default mongoose.model<IPackage>("Package", PackageSchema);
