import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

export const sendForgotPasswordEmail = (email: string, resetLink: string) => {
  const mailOptions: nodemailer.SendMailOptions = {
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
    } else {
      console.log("Recovery email sent");
    }
  });
};
