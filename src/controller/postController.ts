import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import formidable, { File } from "formidable";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import PostModel, { PostDocument } from "../models/postModel";
import { UserModel } from "../models/userModel";
import Report, { IReport } from "../models/reportModel";
import Notification from "../models/notificationModel";
import { CustomRequest } from "../types/userInterfaces";
import { Server as SocketIOServer } from "socket.io";
import {DecodedToken  } from "../types/userInterfaces";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_APIKEY,
  api_secret: process.env.CLOUD_APISECRET,
});


interface ExtendedRequest extends Request {
  files?: any;
  io?: SocketIOServer;
}

export const createPost = async (
  req: ExtendedRequest,
  res: Response
): Promise<void> => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const decoded = jwt.decode(token) as DecodedToken;
    req.body.userId = decoded.id;
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    req.body.username = user.username;
    req.body.userProfilePicture = user.profilePicture;

    const images = req.files;
    console.log(images);

    if (images) {
      const imageUrls = await Promise.all(
        (images.img as File[]).map((image: File) =>
          cloudinary.v2.uploader.upload(image.filepath)
        )
      );
      req.body.img = imageUrls.map((imageUrl) => imageUrl.secure_url);
    }

    const newPost = new PostModel(req.body);
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const getUserPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const posts: PostDocument[] = await PostModel.find({
      userId: req.params.userId,
    });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query: any = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const posts: PostDocument[] = await PostModel.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    res.status(200).json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};




export const editPost = async (req: ExtendedRequest, res: Response) => {
  try {
    const postId = req.params.postId;
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const updateFields: any = {};

    if (req.body.desc) {
      updateFields.desc = req.body.desc;
    }

    if (req.files && req.files.image) {
      const images = req.files.image as File[];
      const newImageUrls = await Promise.all(
        images.map(async (image: File) => {
          const result = await cloudinary.v2.uploader.upload(image.filepath);
          return result.secure_url;
        })
      );

      updateFields.img = [...(post.img || []), ...newImageUrls];
    }

    if (Object.keys(updateFields).length > 0) {
      await PostModel.updateOne({ _id: postId }, { $set: updateFields });
    }

    const updatedPost = await PostModel.findById(postId);

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req: CustomRequest, res: Response) => {
  try {
   
    const postId = req.params.postId;
    const currentUserId = req.currentUser?.id;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await post.deleteOne();
    res.status(200).json("Post deleted");
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const createReport = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    
    const decoded = req.currentUser?.id;

    const user = await UserModel.findById(decoded);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const post = await PostModel.findById(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const newReport: IReport = new Report({
      reason: req.body.reason,
      postId: req.params.postId,
      personId: user._id,
      reportedDatetime: new Date(),
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const likePost = (io: SocketIOServer) => async (
  req: CustomRequest,
  res: Response,

): Promise<void> => {
  try {
    const postId = req.params.postId;

    const post = await PostModel.findById(postId);
    console.log(`post: ${post}`);
    
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    const userId: any = req.currentUser?.id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id !== userId);
      res.status(200).json(post);
    } else {
      post.likes.push(userId);
      const firstImage = Array.isArray(post.img) && post.img.length > 0 ? post.img[0] : undefined;
      const notification = new Notification({
        userId: post.userId,
        postImage:firstImage,
        type: "like",
        content: `${
          (await UserModel.findById(userId))?.username
        } liked your post`,
        postId: post._id,
        createdAt: new Date(),
      });
      await notification.save();
      res.status(200).json({notification});
   
    }
    await post.save();
    
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

export const addComment = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser?.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const postId = req.params.postId;
    const post = await PostModel.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const newComment = {
      _id: new Date().toISOString(),
      text: req.body.text,
      username: user.username,
      createdAt: new Date(),
    };

    post.comments = [...(post.comments || []), newComment];
    await post.save();
    const notification = new Notification({
      userId: post.userId,
      type: "comment",
      content: `${user.username} commented on your post`,
      postId: post._id,
      createdAt: new Date(),
    });
    await notification.save();

    res.status(200).json({post,notification});
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const deleteImage = async (req: CustomRequest, res: Response) => {
  try {

    const currentUserId = req.currentUser?.id;
    const postId = req.params.postId;
    const { imageUrl } = req.body;

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    const publicId = imageUrl.split("/").pop()?.split(".")[0] || "";
    await cloudinary.v2.uploader.destroy(publicId);

    post.img = post.img?.filter((img) => img !== imageUrl) || [];
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ message: "Server error" });
  }
};
