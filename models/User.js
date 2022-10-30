import Mongoose from "mongoose";

const userSchema = Mongoose.Schema({
  name: {
    type: String,
    required: [true, "please provide username"],
    maxLength: 50,
    minlength: 3,
  },
  email: {
    type: String,
    required: [true, "please provide email"],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
    unique: true,
  },
  mobile: {
    type: String,
    required: [true, "please provide number"],
    maxLength: 50,
    minlength: 3,
    unique: true,
  },
  password: {
    type: String,
    required: [true, "please provide password"],
    minlength: 6,
  },
  id: { type: String },
});

export default Mongoose.model("User", userSchema);
