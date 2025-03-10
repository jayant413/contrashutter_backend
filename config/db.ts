import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in the environment variables");
    }
    await mongoose.connect(mongoURI);

    // Log connection details
    const db = mongoose.connection.db;
    if (db) {
      console.log("Connected to MongoDB", db.databaseName);
    } else {
      console.log(
        "Connected to MongoDB but database instance is not available"
      );
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
