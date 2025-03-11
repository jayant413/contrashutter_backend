import mongoose, { Schema, Document } from "mongoose";

// Interface for Card Details
interface ICardDetail {
  product_name: string;
  quantity: number;
}

// Interface for Package Details
interface IPackageDetail {
  title: string;
  subtitle: string[];
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
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  booking_price: { type: Number, required: false },
  card_details: [
    {
      product_name: { type: String, required: false },
      quantity: { type: Number, required: false },
    },
  ],
  package_details: [
    {
      title: { type: String, required: false },
      subtitle: [{ type: String, required: false }],
    },
  ],
  bill_details: [
    {
      type: { type: String, required: false },
      amount: { type: Number, required: false },
    },
  ],
  category: { type: String, required: false },
});

// Export the Package model
export default mongoose.model<IPackage>("Package", PackageSchema);
