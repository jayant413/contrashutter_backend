import mongoose, { Document, Schema } from "mongoose";

interface IFormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  component: "input" | "select" | "textarea";
  options?: string[];
}

// Define the interface for the form document
interface IForm extends Document {
  formTitle: string;
  eventType: mongoose.Types.ObjectId;
  fields: IFormField[];
}

const formFieldSchema = new Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  component: {
    type: String,
    required: true,
    enum: ["input", "select", "textarea"],
  },
  options: [{ type: String }],
});

const formSchema = new Schema(
  {
    formTitle: { type: String, required: true },
    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    fields: [formFieldSchema],
  },
  {
    timestamps: true,
  }
);

// Create and export the model with the interface
export const Form = mongoose.model<IForm>("Form", formSchema);
