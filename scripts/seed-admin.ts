import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI!;

async function seedAdmin() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined. Set it in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;
  const usersCollection = db.collection("users");

  const existing = await usersCollection.findOne({ email: "admin@primetrex.com" });
  if (existing) {
    console.log("Admin user already exists. Updating role to admin...");
    await usersCollection.updateOne(
      { email: "admin@primetrex.com" },
      { $set: { role: "admin", isActive: true, hasPaidSignup: true, isEmailVerified: true } }
    );
    console.log("Admin user updated.");
  } else {
    const passwordHash = await bcrypt.hash("PrimetrexAdminpword1!", 12);
    await usersCollection.insertOne({
      firstName: "Admin",
      lastName: "Primetrex",
      email: "admin@primetrex.com",
      passwordHash,
      role: "admin",
      referralCode: "ADMIN001",
      referredBy: null,
      hasPaidSignup: true,
      signupPaymentRef: null,
      isEmailVerified: true,
      isActive: true,
      telegramId: null,
      telegramLinked: false,
      profileImage: null,
      paystackRecipientCode: null,
      bankDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Admin user created successfully!");
  }

  console.log("Email: admin@primetrex.com");
  console.log("Password: PrimetrexAdminpword1!");

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
