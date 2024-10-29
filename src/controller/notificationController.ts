import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Notification from "../models/notificationModel";
import { CustomRequest } from "../types/userInterfaces";
import { UserModel } from "../models/userModel";


export const getNotifications = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const approveFollowRequest = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { notificationId } = req.params;
    const userId = req.currentUser?.id;

    const notification = await Notification.findById(notificationId);
    if (
      !notification ||
      notification.userId.toString() !== userId ||
      notification.type !== "follow"
    ) {
      return res.status(404).json("Follow request not found");
    }

    const followingUserId = notification.content.split(" ")[0];
    const followingUser = await UserModel.findOne({
      username: followingUserId,
    });

    if (!followingUser) {
      await notification.deleteOne();
      return res.status(404).json("Following user not found");
    }

 
    const currentUser:any = await UserModel.findById(userId);
    if (!currentUser.requests.includes(followingUser._id)) {
      await notification.deleteOne();
      return res.status(200).json("User deleted the follow request");
    }

    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { followers: followingUser._id },
    });
    await UserModel.findByIdAndUpdate(followingUser._id, {
      $addToSet: { following: userId },
    });

    await notification.deleteOne();

    res.status(200).json("Follow request approved");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const declineFollowRequest = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { notificationId } = req.params;
    const userId = req.currentUser?.id;

  
    const notification = await Notification.findById(notificationId);
    if (
      !notification ||
      notification.userId.toString() !== userId ||
      notification.type !== "follow"
    ) {
      return res.status(404).json("Follow request not found");
    }

   
    const followingUsername = notification.content.split(" ")[0];
    const followingUser = await UserModel.findOne({
      username: followingUsername,
    });

    if (!followingUser) {
      return res.status(404).json("Following user not found");
    }

    await UserModel.findByIdAndUpdate(userId, {
      $pull: { requests: followingUser._id },
    });

    
    await notification.deleteOne();

    res.status(200).json("Follow request declined");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};