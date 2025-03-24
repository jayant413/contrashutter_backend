import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Booking, { IBooking, IPaymentDetails } from "../models/booking";
import Invoice from "../models/invoiceModel";
import User from "../models/userModel"; // Assuming a User model exists
import dotenv from "dotenv";
import mongoose from "mongoose";
import ServicePartner from "../models/ServicePartner";
import { AuthRequest } from "../middlewares/authMiddleware";

dotenv.config(); // Load environment variables

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Store JWT secret securely

export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract token from cookies
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (!decoded?.id) {
      res.status(401).json({ message: "Unauthorized: Invalid token" });
      return;
    }

    // Fetch the user from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Calculate payment details based on package price and payment type
    const { package_details, payment_details } = req.body;
    const totalPrice = package_details.price;
    const installmentType = Number(payment_details.paymentType);
    const installmentAmount =
      installmentType === 1
        ? totalPrice
        : installmentType === 3
        ? Math.ceil(totalPrice * 0.3)
        : Math.ceil(totalPrice / installmentType);
    const dueAmount = totalPrice - installmentAmount;

    // Create payment details
    const updatedPaymentDetails = {
      installment: installmentType,
      paymentMethod: payment_details.paymentMethod || "Razorpay",
      payablePrice: totalPrice,
      paidAmount: installmentAmount,
      dueAmount: dueAmount,
      paymentType: dueAmount > 0 ? "3 Installments" : "Full Payment",
      paymentStatus: dueAmount > 0 ? "Pending" : "Completed",
      paymentDate: new Date(),
    };

    // Create booking with updated payment details
    const bookingData = {
      ...req.body,
      userId: user._id,
      status: "Booked",
      statusHistory: [{ status: "Booked" }],
      payment_details: updatedPaymentDetails,
    };

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // Create initial invoice
    const invoice = new Invoice({
      bookingId: newBooking._id,
      paymentType: 1,
      paymentMethod: payment_details.paymentMethod || "Razorpay",
      payablePrice: totalPrice,
      paidAmount: installmentAmount,
      dueAmount: dueAmount,
      paymentStatus: "Completed",
      razorpayOrderId: payment_details.razorpayOrderId,
      razorpayPaymentId: payment_details.razorpayPaymentId,
    });

    await invoice.save();

    // Update booking with invoice reference
    newBooking.invoices = [invoice._id];
    await newBooking.save();

    res.status(200).json(newBooking);
  } catch (error: unknown) {
    console.error("Error creating booking:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      message: "Error creating booking",
      error: errorMessage,
    });
  }
};

// Get all Bookings based on user role
export const getBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract token from cookies
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
    };

    let bookings: IBooking[] | unknown = [];
    const populateOptions = ["servicePartner", "userId", "invoices"];

    if (decoded.role === "Service Provider") {
      // For service providers, get bookings where they are assigned
      const servicePartner = await ServicePartner.findOne({
        partner: decoded.id,
      });
      if (servicePartner) {
        bookings = await Booking.find({
          servicePartner: servicePartner._id,
        }).populate(populateOptions);
      } else {
        bookings = [];
      }
    } else if (decoded.role === "Client") {
      // For clients, get their own bookings
      bookings = await Booking.find({
        userId: decoded.id,
      }).populate(populateOptions);
    } else {
      // For admin, get all bookings
      bookings = await Booking.find().populate(populateOptions);
    }

    res.json(bookings);
  } catch (error: unknown) {
    console.error("Error fetching bookings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: errorMessage });
  }
};

// Get a Booking by ID (Accepts linked data if applicable)
export const getBookingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id).populate([
      "servicePartner",
      "userId",
      "invoices",
    ]);

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.json(booking);
  } catch (error: unknown) {
    console.error("Error fetching booking:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching booking", error: errorMessage });
  }
};

// Update Booking by ID - handles both full updates and serviceProviderId updates
export const updateBookingById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: bookingId } = req.params;
    const updateData = req.body;

    // Validate bookingId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({ message: "Invalid Booking ID format" });
      return;
    }

    // If ordered status is being updated
    if (updateData.hasOwnProperty("ordered")) {
      const booking: IBooking | null = await Booking.findById(bookingId);
      if (!booking) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }

      const dataToUpdate: {
        ordered: boolean;
        invoices?: mongoose.Types.ObjectId[];
        payment_details: IPaymentDetails;
      } = {
        ordered: updateData.ordered,
        invoices: booking.invoices,
        payment_details: booking.payment_details as IPaymentDetails,
      };

      if (booking.payment_details?.installment !== 1) {
        // Create new invoice for the payment
        const invoice = new Invoice({
          bookingId: booking._id,
          paymentType: 3,
          paymentMethod: updateData.payment_details.paymentMethod || "Razorpay",
          payablePrice: booking.payment_details?.payablePrice,
          paidAmount: booking.payment_details?.dueAmount,
          dueAmount: 0,
          paymentStatus: "Completed",
          razorpayOrderId: updateData.payment_details.razorpayOrderId,
          razorpayPaymentId: updateData.payment_details.razorpayPaymentId,
        });

        await invoice.save();

        dataToUpdate.invoices?.push(invoice._id);
        dataToUpdate.payment_details = {
          ...dataToUpdate.payment_details,
          paidAmount: booking.payment_details?.payablePrice || 0,
          dueAmount: 0,
          paymentStatus: "Completed",
        };
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        dataToUpdate,
        { new: true }
      ).populate(["userId", "servicePartner"]);

      // Send notification to admin
      const adminUsers = await User.find({ role: "Admin" });
      for (const admin of adminUsers) {
        admin.notifications.unshift({
          title: `New Order for ${booking.booking_no}`,
          message: `Client has placed an order for booking ${booking.booking_no}`,
          redirectPath: `/admin/bookings/${bookingId}`,
          sender: new mongoose.Types.ObjectId(req.user?.id),
          read: false,
        });
        await admin.save();
      }

      res.status(200).json({
        message: "Order status updated successfully",
        updatedBooking,
      });
      return;
    }

    // If payment_details is provided, handle it specially
    if (updateData.payment_details) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }

      const paymentDetails = booking.payment_details as {
        installment: number;
        payablePrice: number;
        paidAmount: number;
      };

      // Create new invoice for the payment
      const invoice = new Invoice({
        bookingId: booking._id,
        paymentType: 2,
        paymentMethod: updateData.payment_details.paymentMethod || "Razorpay",
        payablePrice: paymentDetails.payablePrice,
        paidAmount: paymentDetails.payablePrice * 0.4, // Set paid amount to 40% of payablePrice
        dueAmount: paymentDetails.payablePrice * 0.3, // Set due amount to 30% of payablePrice
        paymentStatus: "Completed",
        razorpayOrderId: updateData.payment_details.razorpayOrderId,
        razorpayPaymentId: updateData.payment_details.razorpayPaymentId,
      });

      await invoice.save();

      // Update booking with new payment details and invoice reference
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          payment_details: updateData.payment_details,
          $push: { invoices: invoice._id },
        },
        { new: true, runValidators: true }
      ).populate(["invoices", "userId", "servicePartner"]);

      // Send notification to client about successful payment
      const clientUser = await User.findById(booking.userId);
      if (clientUser) {
        clientUser.notifications.unshift({
          title: "Payment Successful",
          message: `Your balance payment of ₹${invoice.paidAmount} has been received successfully`,
          redirectPath: `/client/my-bookings/${bookingId}`,
          sender: new mongoose.Types.ObjectId(req.user?.id),
          read: false,
        });
        await clientUser.save();
      }

      const adminUsers = await User.find({ role: "Admin" });
      for (const admin of adminUsers) {
        admin.notifications.unshift({
          title: `Booking ${updatedBooking?.booking_no}`,
          message: `The client has successfully paid a balance amount of ₹${invoice.paidAmount} for the booking.`,
          redirectPath: `/admin/bookings/${bookingId}`,
          sender: new mongoose.Types.ObjectId(req.user?.id),
          read: false,
        });
        await admin.save();
      }

      res.status(200).json({
        message: "Payment details updated successfully",
        updatedBooking,
      });
      return;
    }

    // If only status is provided, handle it specially
    if (Object.keys(updateData).length === 1 && updateData.status) {
      const booking = await Booking.findById(bookingId).populate(
        "userId servicePartner"
      );
      if (!booking) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: updateData.status,
          $push: {
            statusHistory: {
              status: updateData.status,
              updatedAt: new Date(),
            },
          },
        },
        { new: true, runValidators: true }
      ).populate(["userId", "servicePartner"]);

      // Send notification to client
      if (booking.userId) {
        const clientUser = await User.findById(booking.userId);
        if (clientUser) {
          clientUser.notifications.unshift({
            title: "Booking Status Updated",
            message: `Your booking status has been updated to ${updateData.status}`,
            redirectPath: `/client/my-bookings/${bookingId}`,
            sender: new mongoose.Types.ObjectId(req.user?.id),
            read: false,
          });
          await clientUser.save();
        }
      }

      // Send notification to service partner if assigned
      if (booking.servicePartner) {
        const servicePartner = await ServicePartner.findById(
          booking.servicePartner
        );
        if (servicePartner) {
          const partnerUser = await User.findById(servicePartner.partner);
          if (partnerUser) {
            partnerUser.notifications.unshift({
              title: "Booking Status Updated",
              message: `Booking status has been updated to ${updateData.status}`,
              redirectPath: `/partner/bookings/${bookingId}`,
              sender: new mongoose.Types.ObjectId(req.user?.id),
              read: false,
            });
            await partnerUser.save();
          }
        }
      }

      res.status(200).json({
        message: "Status updated successfully",
        updatedBooking,
      });
      return;
    }

    // If only servicePartner is provided, handle it specially
    if (
      Object.keys(updateData).length === 2 &&
      updateData.servicePartner &&
      updateData.assignedStatus
    ) {
      if (!mongoose.Types.ObjectId.isValid(updateData.servicePartner)) {
        res.status(400).json({ message: "Invalid Service Provider ID format" });
        return;
      }

      const serviceProviderObjectId = new mongoose.Types.ObjectId(
        updateData.servicePartner
      );

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          servicePartner:
            updateData.assignedStatus === "Rejected"
              ? null
              : serviceProviderObjectId,
          assignedStatus: updateData.assignedStatus,
          $push: {
            assignedStatusHistory: {
              $each: [
                {
                  status: updateData.assignedStatus,
                  date: new Date(),
                  servicePartner: serviceProviderObjectId,
                },
              ],
              $position: 0,
            },
          },
        },
        { new: true, runValidators: true }
      ).populate("servicePartner");

      // Send notification to service partner
      const servicePartner = await ServicePartner.findById(
        updateData.servicePartner
      );
      const user = await User.findById(servicePartner?.partner);

      if (user) {
        user.notifications.unshift({
          title: "Booking Requested",
          message: `New Booking Request for ${"Booking"}`,
          createdAt: new Date(),
          redirectPath: `/partner/bookings/${bookingId}`,
          sender: new mongoose.Types.ObjectId(req.user?.id),
          read: false,
        });
        await user.save();
      }

      // If status is Accepted or Rejected, notify admin
      if (
        updateData.assignedStatus === "Accepted" ||
        updateData.assignedStatus === "Rejected"
      ) {
        const adminUsers = await User.find({ role: "Admin" });
        for (const admin of adminUsers) {
          admin.notifications.unshift({
            title: `Booking ${updateData.assignedStatus}`,
            message: `Service partner has ${updateData.assignedStatus.toLowerCase()} the booking`,
            redirectPath: `/admin/bookings/${bookingId}`,
            sender: new mongoose.Types.ObjectId(req.user?.id),
            read: false,
          });
          await admin.save();
        }
      }

      if (!updatedBooking) {
        res.status(404).json({ message: "Booking not found" });
        return;
      }

      res.status(200).json({
        message: "Service Provider added successfully",
        updatedBooking,
      });
      return;
    }

    // Handle full booking update
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.status(200).json({
      message: "Booking updated successfully",
      updatedBooking,
    });
  } catch (error: unknown) {
    console.error("Error updating booking:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error updating booking", error: errorMessage });
  }
};

export const getBookingsByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params; // Extract userId from request params

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const bookings = await Booking.find({ userId });

    if (!bookings.length) {
      res.status(404).json({ message: "No bookings found for this user" });
      return;
    }

    res.status(200).json(bookings);
  } catch (error: unknown) {
    console.error("Error fetching user bookings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching user bookings", error: errorMessage });
  }
};
