import mongoose from "mongoose";

// Function to connect to MongoDB
export async function connectDB() {
  // If already connected, do nothing
  if (mongoose.connection.readyState >= 1) return;

  // Otherwise, connect to MongoDB using environment variable
  return mongoose.connect(process.env.MONGODB_URI as string);
}
