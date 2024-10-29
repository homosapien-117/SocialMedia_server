import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import Report from "../models/reportModel";
import PostModel from "../models/postModel";
import mongoose from "mongoose";

export const getAllUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const skip = (page - 1) * limit;

    const users = await UserModel.find(
      { username: { $ne: "Admin" } },
      { password: 0 }
    )
    .skip(skip)
    .limit(limit)
    .exec();

    const totalUsers = await UserModel.countDocuments({ username: { $ne: "Admin" } }).exec();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({ users, totalPages });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
};


export const blockuser = async (req: Request, res: Response): Promise<void> => {
  try {
    await UserModel.findByIdAndUpdate(req.params.id, {
      $set: { blocked: true },
    }).exec();
    res.status(200).json("Account Blocked Successfully");
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
};

export const unblockuser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await UserModel.findByIdAndUpdate(req.params.id, {
      $set: { blocked: false },
    }).exec();
    res.status(200).json("Account UNBlocked Successfully");
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
};

export const deleteuser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  console.log(id);
  try {
    await UserModel.findByIdAndDelete(id).exec();
    res.status(200).json("user Deleted");
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
};

export const edituser = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  const { username, email } = req.body;
  console.log(username);

  try {
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { username, email } },
      { new: true }
    ).exec();

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: String(error) });
    }
  }
};

export const getReportedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {
      $or: [
        { reason: new RegExp(search as string, "i") },
        { 'post.desc': new RegExp(search as string, "i") },
        { 'reportedUser.username': new RegExp(search as string, "i") }
      ]
    };
    console.log(query);
    
    const reports = await Report.find(query)
      .skip(skip)
      .limit(Number(limit))
      .exec();

    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        const post = await PostModel.findById(report.postId).exec();
        const postOwner = await UserModel.findById(post?.userId).exec();
        const reportedUser = await UserModel.findById(report.personId).exec();
        return {
          ...report.toObject(),
          post,
          reportedUser,
          postOwner,
        };
      })
    );

    const totalReports = await Report.countDocuments(query).exec();

    res.status(200).json({
      reports: detailedReports,
      total: totalReports,
    });
  } catch (error) {
    handleError(res, error);
  }
};


export const getReportDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }
    const reports = await Report.find({ postId: postId }).exec();

    if (reports.length === 0) {
      res
        .status(404)
        .json({ message: "No reports found for the given post ID" });
      return;
    }
    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        const post = await PostModel.findById(report.postId).exec();
        const postOwner = await UserModel.findById(post?.userId).exec();
        const reportedUser = await UserModel.findById(report.personId).exec();
        return {
          report: {
            reason: report.reason,
            reportedDatetime: report.reportedDatetime,
          },
          post: {
            description: post?.desc,
            images: post?.img,
          },
          postOwner: {
            username: postOwner?.username,
            email: postOwner?.email,
          },
          reportedUser: {
            username: reportedUser?.username,
            email: reportedUser?.email,
          },
        };
      })
    );

    res.status(200).json(detailedReports);
  } catch (error) {
    handleError(res, error);
  }
};

export const blockPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.postId;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await PostModel.findByIdAndUpdate(postId, { blocked: true }, { new: true }).exec();
    
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    
    res.status(200).json({ message: "Post blocked successfully", post });
  } catch (error) {
    handleError(res, error);
  }
};

export const unblockPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.postId;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await PostModel.findByIdAndUpdate(postId, { blocked: false }, { new: false }).exec();
    
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    
    res.status(200).json({ message: "Post blocked successfully", post });
  } catch (error) {
    handleError(res, error);
  }
};

const handleError = (res: Response, error: unknown): void => {
  if (error instanceof Error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(500).json({ error: String(error) });
  }
};

