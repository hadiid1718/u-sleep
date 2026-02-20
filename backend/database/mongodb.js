import mongoose from "mongoose";
import { DB_URI, NODE_ENV } from "../config/env.js";

if (!DB_URI) {
  throw new Error(
    "MONGO_URI is not defined in .env.<development/production>.local",
  );
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log(`Connected to MongoDB in ${NODE_ENV} environment`);
  } catch (error) {
    console.log("Error Connecting to MongoDB", error);
    process.exit(1);
  }
};

export default connectToDatabase;
