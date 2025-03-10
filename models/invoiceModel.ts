import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
  {
    invoice_no: { type: String, unique: true },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    paymentType: { type: Number, enum: [1, 3], required: true },
    paymentMethod: { type: String, required: true },
    payablePrice: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true }
);

// Add pre-save middleware to generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (!this.invoice_no) {
    const lastInvoice = await Invoice.findOne(
      {},
      {},
      { sort: { invoice_no: -1 } }
    );
    let nextNumber = "000001";

    if (lastInvoice && lastInvoice.invoice_no) {
      const lastNumber = parseInt(lastInvoice.invoice_no.replace("CSIV", ""));
      nextNumber = String(lastNumber + 1).padStart(6, "0");
    }

    this.invoice_no = `CSIV${nextNumber}`;
  }
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
