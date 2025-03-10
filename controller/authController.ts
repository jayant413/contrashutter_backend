import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/userModel";
import nodemailer from "nodemailer";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fullname, contact, email, password } = req.body;
    let role = req.body.role;
    if (!fullname || !contact || !email || !password || !role) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (
      email === process.env.ADMIN_EMAIL &&
      contact === process.env.ADMIN_NUMBER
    ) {
      role = "Admin";
    }

    const existingUser = await User.findOne({
      email,
      role,
      contact,
    });
    if (existingUser) {
      res.status(409).json({ message: "User already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      contact,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, contact, password: loginPassword } = req.body;
    let role = req.body.role;

    if (
      email === process.env.ADMIN_EMAIL ||
      contact === process.env.ADMIN_NUMBER
    ) {
      role = "Admin";
    }

    if (!email || !loginPassword || !role) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const user = await User.findOne({
      $or: [
        { email, role },
        { contact, role },
      ],
    }).populate("wishlist");
    if (!user) {
      res.status(401).json({ message: "Invalid email/contact or role" });
      return;
    }

    const isMatch = await bcrypt.compare(loginPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" } // Changed expiry to 1 day
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000, // Changed maxAge to 1 day in milliseconds
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Login successful",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

export const contactUs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, phone, email, subject, message } = req.body;

    if (!first_name || !last_name || !phone || !email || !subject || !message) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password from Gmail
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Your admin email where you want to receive contact form submissions
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${first_name} ${last_name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};
