import mongoose, { Schema, Document } from "mongoose";

// Define interfaces for embedded objects
interface IBasicInfo {
  fullName?: string;
  gender?: string;
  dateOfBirth?: Date;
  email?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface IEventDetails {
  eventName?: string;
  eventDate?: Date;
  eventStartTime?: string;
  eventEndTime?: string;
  venueName?: string;
  venueAddressLine1?: string;
  venueAddressLine2?: string;
  venueCity?: string;
  venuePincode?: string;
  numberOfGuests?: number;
  specialRequirements?: string;
}

interface IDeliveryAddress {
  sameAsClientAddress?: boolean;
  recipientName?: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  deliveryContactNumber?: string;
  additionalDeliveryInstructions?: string;
}

export interface IPaymentDetails {
  installment: number;
  payablePrice: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: string;
  paymentType?: string;
  paymentStatus?: string;
  paymentDate?: Date;
}

interface ICardDetail {
  product_name?: string;
  quantity?: number;
}

interface IPackageDetail {
  eventName?: string;
  serviceName?: string;
  name: string;
  price?: number;
  booking_price?: number;
  payablePrice: number;
  paidAmount: number;
  installment: 1 | 3;
  card_details?: ICardDetail[];
  package_details?: { title: string; subtitle: string[] }[];
  bill_details?: { type: string; amount: number }[];
  category?: string;
}

interface IStatusHistory {
  status:
    | "Booked"
    | "In Progress"
    | "Deliverables Ready"
    | "Completed"
    | "Cancelled";
  updatedAt?: Date;
}

interface IAssignedStatusHistory {
  status: "Requested" | "Accepted" | "Completed" | "Rejected";
  updatedAt?: Date;
  servicePartner?: mongoose.Types.ObjectId;
}

export interface IBooking extends Document {
  booking_no: string;
  ordered?: boolean;
  userId: mongoose.Types.ObjectId;
  basic_info?: IBasicInfo;
  form_details?: Record<string, string | number | boolean>;
  event_details?: IEventDetails;
  delivery_address?: IDeliveryAddress;
  payment_details?: IPaymentDetails;
  invoices?: mongoose.Types.ObjectId[];
  package_details: IPackageDetail;
  assignedStatus?: "Requested" | "Accepted" | "Completed" | "Rejected";
  servicePartner?: mongoose.Types.ObjectId;
  assignedStatusHistory?: IAssignedStatusHistory[];
  status?:
    | "Booked"
    | "In Progress"
    | "Deliverables Ready"
    | "Completed"
    | "Cancelled";
  statusHistory?: IStatusHistory[];
  agreeToTerms?: boolean;
  confirmBookingDetails?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for a booking
const bookingSchema: Schema = new Schema<IBooking>(
  {
    booking_no: { type: String, unique: true },
    ordered: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },

    basic_info: {
      fullName: { type: String },
      gender: { type: String },
      dateOfBirth: { type: Date },
      email: { type: String },
      phoneNumber: { type: String },
      alternatePhoneNumber: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    form_details: { type: mongoose.Schema.Types.Mixed },
    event_details: {
      eventName: { type: String },
      eventDate: { type: Date },
      eventStartTime: { type: String },
      eventEndTime: { type: String },
      venueName: { type: String },
      venueAddressLine1: { type: String },
      venueAddressLine2: { type: String },
      venueCity: { type: String },
      venuePincode: { type: String },
      numberOfGuests: { type: Number },
      specialRequirements: { type: String },
    },
    delivery_address: {
      sameAsClientAddress: { type: Boolean },
      recipientName: { type: String },
      deliveryAddressLine1: { type: String },
      deliveryAddressLine2: { type: String },
      deliveryCity: { type: String },
      deliveryState: { type: String },
      deliveryPincode: { type: String },
      deliveryContactNumber: { type: String },
      additionalDeliveryInstructions: { type: String },
    },
    payment_details: {
      installment: { type: Number, enum: [1, 3] },
      paymentMethod: { type: String },
      payablePrice: { type: Number },
      paidAmount: { type: Number },
      dueAmount: { type: Number },
      paymentType: { type: String },
      paymentStatus: { type: String },
      paymentDate: { type: Date },
    },
    invoices: [{ type: Schema.Types.ObjectId, ref: "Invoice" }],
    package_details: {
      eventName: { type: String },
      serviceName: { type: String },
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
          subtitle: [{ type: String }],
        },
      ],
      bill_details: [
        {
          type: { type: String },
          amount: { type: Number },
        },
      ],
      category: { type: String },
    },
    assignedStatus: {
      type: String,
      enum: ["Requested", "Accepted", "Completed", "Rejected"],
      required: false,
    },
    servicePartner: { type: Schema.Types.ObjectId, ref: "ServicePartner" },

    assignedStatusHistory: [
      {
        status: {
          type: String,
          enum: ["Requested", "Accepted", "Completed", "Rejected"],
          required: false,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        servicePartner: { type: Schema.Types.ObjectId, ref: "ServicePartner" },
      },
    ],
    status: {
      type: String,
      enum: [
        "Booked",
        "In Progress",
        "Deliverables Ready",
        "Completed",
        "Cancelled",
      ],
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "Booked",
            "In Progress",
            "Deliverables Ready",
            "Completed",
            "Cancelled",
          ],
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    agreeToTerms: { type: Boolean },
    confirmBookingDetails: { type: Boolean },
  },
  { timestamps: true }
);

// Add pre-save middleware to generate booking number
bookingSchema.pre("save", async function (next) {
  if (!this.booking_no) {
    const lastBooking: IBooking | null = await Booking.findOne(
      {},
      {},
      { sort: { booking_no: -1 } }
    );
    let nextNumber = "00001";

    if (lastBooking && lastBooking.booking_no) {
      const lastNumber = parseInt(lastBooking.booking_no.replace("CS", ""));
      nextNumber = String(lastNumber + 1).padStart(5, "0");
    }

    this.booking_no = `CS${nextNumber}`;
  }
  next();
});

// Create and export the model
const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
