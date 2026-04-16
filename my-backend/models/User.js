import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // hashed with bcrypt if not Google account
    role: {
      type: String,
      enum: ["user", "host", "admin"],
      default: "user",
    },
    profilePicture: { type: String },
    isGoogleAccount: { type: Boolean, default: false },
    username: { type: String, unique: true, sparse: true },
    timezone: { type: String, default: "UTC" },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },

    // Scheduling / availability
    availability: {
      type: Object, // e.g., { mon: ["09:00-12:00", "13:00-17:00"], ... }
      default: {},
    },
    bufferTime: { type: Number, default: 0 }, // minutes before/after meetings
    dailyLimit: { type: Number, default: 0 }, // max bookings per day
    bookingLink: { type: String, default: "" }, // unique public booking URL
    suspended: { type: Boolean, default: false }, // for admin suspension
  },
  { timestamps: true }
);
// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: String,
//     email: { type: String, unique: true, index: true },
//     passwordHash: String,
//     role: { type: String, enum: ["guest", "host", "admin"], default: "guest" },
//     username: { type: String, unique: true },
//     isSuspended: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("User", userSchema);

export default mongoose.model("User", userSchema);
