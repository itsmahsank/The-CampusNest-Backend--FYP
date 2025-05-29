const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");


const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true, //Removes spaces from start and end
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
       unique: true,
       trim: true,
       lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    userType: {
      type: String,
      enum: ["tenant", "owner"],
      required: true,
    },
    address: {
      street: String,
      city: String,
      district: String,
      state: String,
      postalCode: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    refreshToken: {
      type: String,
    },

    isVerified: { type: Boolean, default: false }, //  field for verification

    verificationToken: {
      type: String,
    }, // Stores verification token

    verificationTokenExpires: {
      type: Date,
      default: null,
    }, 

  },
  { timestamps: true }
);

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// userSchema.methods.isPasswordCorrect = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

 userSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
     {
       _id: this._id,
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
       expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
     }
   );
 };
module.exports = mongoose.model("User", userSchema);
