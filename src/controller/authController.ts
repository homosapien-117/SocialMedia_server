import { UserModel, IUser } from "../models/userModel";
import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import createError from "http-errors";
import jwt from "jsonwebtoken";
import { sendEmailtoUser } from "../utils/sendmail";
import { sendForgotPasswordEmail } from "../utils/forgotmail";
import PostModel from "../models/postModel";
import { CustomRequest } from "../types/userInterfaces";
import dotenv from "dotenv";
dotenv.config()


////////////////////Signup////////////////////////////
export const signup = [
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("confirmpassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log(req.body);
      const existingEmailUser = await UserModel.findOne({
        email: req.body.email,
      });
      const existingUsernameUser = await UserModel.findOne({
        username: req.body.username,
      });

      if (existingEmailUser) {
        return next(new createError.BadRequest("Email already in use!"));
      }

      if (existingUsernameUser) {
        return next(new createError.BadRequest("Username already taken!"));
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 12);
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
      const newUser = await UserModel.create({
        ...req.body,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
        isVerified: false,
      });

      const verificationLink = `${process.env.EMAILVARIFICATIONLINK}${verificationToken}`;

      sendEmailtoUser(verificationLink, newUser.email);

      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        verificationToken,
      });
    } catch (error) {
      next(error);
      console.log(error);
    }
  },
];

////////////////////Email verification////////////////////////////

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req);
    const verificationToken = req.params.token;
    console.log(verificationToken);
    const user = await UserModel.findOne({
      verificationToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new createError.BadRequest("Token is invalid or has expired")
      );
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    next(error);
  }
};

////////////////////Login////////////////////////////

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({
      email,
      blocked: false,
      isVerified: true,
      isAdmin: false,
    });

    if (!user) {
      return next(
        new createError.BadRequest("User not found or Blocked by admin")
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new createError.BadRequest("Password incorrect"));
    }

    const token = jwt.sign({ id: user._id }, "secretkey123", {
      expiresIn: "90d",
    });

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio:user.bio,
        following:user.following,
        followers:user.followers,
        profilePicture:user.profilePicture,
        isPrivate:user.isPrivate

      },
    });
  } catch (error) {
    next(error);
  }
};

////////////////////ForgotPassword////////////////////////////

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const user: IUser | null = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).send("User with given email does not exist.");
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);

    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    sendForgotPasswordEmail(user.email, resetLink);

    res.status(200).send("Recovery email sent");
  } catch (err) {
    console.error("Error during the password reset process:", err);
    next(err);
  }
};

////////////////////resetpassword////////////////////////////

export const resetPassword = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { token } = req.params;
      const { password } = req.body;

      const user: IUser | null = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .send("Password reset token is invalid or has expired.");
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.status(200).send("Password has been reset.");
    } catch (err) {
      console.error("Error resetting password:", err);
      next(err);
    }
  },
];

////////////////////Admin Login////////////////////////////

export const adminlogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const user: IUser | null = await UserModel.findOne({ email });
    if (!user) {
      return next(new createError.BadRequest("User not found"));
    }
    console.log("User found:", user);
    const ispasswordvalid = await bcrypt.compare(password, user.password);
    if (!ispasswordvalid) {
      console.log("Password incorrect");
      return next(new createError.BadRequest("Password incorrect"));
    }
    const isAdmin = user.isAdmin;
    if (isAdmin === false) {
      console.log("not admin");
      return next(new createError.BadRequest("Not admin"));
    }
    const token = jwt.sign({ id: user._id }, "secretkey123", {
      expiresIn: "90d",
    });

    res.status(200).json({
      status: "success",
      token,
      message: "Admin Logged in successfully",
      user: {
        _id: user._id,
        name: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};



export const getTimelinePost = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.currentUser?.id;
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return next(new createError.NotFound('User not found'));
    }

    const following = currentUser.following ?? [];
    const userPosts = await PostModel.find({ userId: currentUser._id , blocked:false});
    const friendPosts = await Promise.all(
      following.map(async (friendId: string) => {
        return await PostModel.find({ userId: friendId, blocked:false});
      })
    );

    const posts = userPosts.concat(...friendPosts);
    const detailedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await UserModel.findById(post.userId);
        return {
          ...post.toObject(),
          authorName: author?.username,
          authorProfilePicture: author?.profilePicture,
        };
      })
    );

    detailedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.status(200).json(detailedPosts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getUserRegistrationStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Find users registered between startDate and endDate
    const registrations = await UserModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    res.json({ data: registrations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching registration stats" });
  }
};
