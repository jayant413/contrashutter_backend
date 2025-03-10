import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  eventName: string;
  packageIds: mongoose.Types.ObjectId[];
  serviceId: mongoose.Types.ObjectId;
  image: string | null;
  formId: mongoose.Types.ObjectId;
}

const EventSchema = new Schema<IEvent>({
  eventName: { type: String, required: true },
  formId: { type: Schema.Types.ObjectId, ref: "Form" },
  packageIds: [{ type: Schema.Types.ObjectId, ref: "Package" }],
  serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  image: { type: String, default: null },
});

export default mongoose.model<IEvent>("Event", EventSchema);
