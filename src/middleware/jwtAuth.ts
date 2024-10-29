import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel";

import dotenv from "dotenv";
dotenv.config();
import { DecodedToken, CustomRequest } from "../types/userInterfaces";

const secretKey: any = process.env.JWT_SECRETKEY;

export const authenticateToken = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json("Token not provided");
  }

  try {
    const decoded = jwt.verify(token, secretKey) as DecodedToken;
    req.currentUser = { id: decoded.id };
    const user = await UserModel.findById(decoded.id);
    if (user?.blocked == false) {
      next();
    } else {
      console.log("hey you are blocked");
      return res
        .status(403)
        .json({ error: "User is blocked. Please log out." });
    }
  } catch (err) {
    return res.status(400).json("Invalid token");
  }
};
