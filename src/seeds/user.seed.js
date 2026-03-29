import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await User.deleteMany();

    const users = [
      {
        fullName: "Rahul",
        email: "rahul@test.com",
        password: await bcrypt.hash("123456", 10),
      },
      {
        fullName: "Aman",
        email: "aman@test.com",
        password: await bcrypt.hash("123456", 10),
      },
      {
        fullName: "Priya",
        email: "priya@test.com",
        password: await bcrypt.hash("123456", 10),
      },
    ];

    await User.insertMany(users);

    console.log("Users seeded");
    process.exit();
  } catch (error) {
    console.log("Seed error:", error.message);
    process.exit(1);
  }
};

seedUsers();