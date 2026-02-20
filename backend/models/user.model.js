import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [ true, "Name is required"],
        trim: true,
        minlength: [4, "Name must be at least 4 characters long"],
        maxlength: [50, "Name must be at most 50 characters long"]
    },
    email: {
        type: String,
        required: [ true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: { 
        type:String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
}, {timestamps:true})

const User = mongoose.model("User", userSchema);

export default User;