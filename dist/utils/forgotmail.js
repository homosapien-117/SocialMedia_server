"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendForgotPasswordEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});
const sendForgotPasswordEmail = (email, resetLink) => {
    const mailOptions = {
        to: email,
        from: "your-email@gmail.com",
        subject: "Password Reset",
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
           Please click on the following link, or paste this into your browser to complete the process:\n\n
           ${resetLink}\n\n
           If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };
    transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
            console.error("There was an error:", err);
            throw new Error("Error sending email");
        }
        else {
            console.log("Recovery email sent");
        }
    });
};
exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
