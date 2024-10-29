import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import { CustomRequest } from "../types/userInterfaces";
import { IUser } from "../types/userInterfaces";
import Message from "../models/messageModel";
import Chat from "../models/chatModel";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_APIKEY,
  api_secret: process.env.CLOUD_APISECRET,
});

export const searchChat = async (req: CustomRequest, res: Response) => {
  try {
    const searchTerm = req.params.searchTerm.toLowerCase();
    const currentUserId = req.currentUser?.id;

    if (!searchTerm) {
      return res.json([]);
    }

    const currentUser: any = await UserModel.findById(currentUserId).select(
      "followers following"
    );
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const followers = await Promise.all(
      currentUser.followers.map((follower: any) =>
        UserModel.findById(
          typeof follower === "object" ? follower._id || follower.id : follower
        ).select("username profilePicture")
      )
    );

    const following = await Promise.all(
      currentUser.following.map((following: any) =>
        UserModel.findById(
          typeof following === "object"
            ? following._id || following.id
            : following
        ).select("username profilePicture")
      )
    );

    const uniqueUsers = new Map<string, any>();
    [...followers, ...following].forEach((user) => {
      if (user) {
        uniqueUsers.set(user._id.toString(), {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        });
      }
    });

    const relevantUsers = Array.from(uniqueUsers.values()).filter((user) =>
      user.username.toLowerCase().includes(searchTerm)
    );

    res.json(relevantUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const createGroupChat = async (req: CustomRequest, res: Response) => {
  try {
    const { groupName, participants } = req.body;
    const userId = req.currentUser?.id;

    if (!userId || !groupName || participants.length === 0) {
      return res
        .status(400)
        .json({ error: "Group name and participants are required" });
    }

    const newChat = new Chat({
      participants: [userId, ...participants],
      groupName,
      admin: userId,
      lastMessage: { messageId: null },
      timeStamp: new Date(),
      status: false,
      readAt: null,
      isDeleted: false,
    });

    await newChat.save();
    res.status(201).json(newChat);
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({ error: "Failed to create group chat" });
  }
};

export const getChatMessages = async (req: CustomRequest, res: Response) => {
  const { userId } = req.query;
  console.log(userId);
  const loggedInUserId = req.currentUser?.id;

  try {
    const user = await UserModel.findOne({ _id: loggedInUserId });
    const chat = await Chat.findOne({ _id: userId })
      .populate("participants", "username profilePicture")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "Chat not found" });
    }
    if (chat?.groupName) {
      return res.json({
        _id: chat._id,
        groupName: chat.groupName,
        participants: chat.participants,
      });
    } else {
      res.json({
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      });
    }
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const { chatId, content, senderName } = req.body;
  const senderId = req.body.senderId;
  const image = (req as any).files?.image;
  const document = (req as any).files?.document;
  const chat: any = await Chat.findById(chatId);

  try {
    let imageUrl: any = "";
    let documentUrl: any = "";
    if (image) {
      if (Array.isArray(image)) {
        imageUrl = await Promise.all(
          image.map(async (img: any) => {
            const result = await cloudinary.v2.uploader.upload(img.filepath);
            return result.secure_url;
          })
        );
      } else {
        const result = await cloudinary.v2.uploader.upload(image.filepath);
        imageUrl = result.secure_url;
      }
    }

    if (document) {
      console.log("Document file to upload:", document);

      if (Array.isArray(document)) {
        documentUrl = await Promise.all(
          document.map(async (doc: any) => {
            const result = await cloudinary.v2.uploader.upload(doc.filepath, {
              resource_type: "raw",
            });
            console.log(result);
            documentUrl = result.secure_url;
            return result.secure_url;
          })
        );
      } else {
        const result = await cloudinary.v2.uploader.upload(document.filepath, {
          resource_type: "raw",
        });
        documentUrl = result.secure_url;
      }
    }
    const newMessage = new Message({
      chatId,
      senderId,
      content,
      senderName,
      imageUrl,
      documentUrl,
      timeStamp: new Date(),
      status: false,
      isDeleted: false,
    });
    await newMessage.save();
    if (newMessage) {
      chat.lastMessage.messageId = newMessage._id;
    }
    await chat.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createOrGetChat = async (req: CustomRequest, res: Response) => {
  try {
    const { selectedUserId } = req.body;
    console.log(selectedUserId);

    const userId = req.currentUser?.id;
    const chatData: any = await Chat.findOne({ _id: selectedUserId });

    console.log(`chatData: ${chatData}`);

    if (chatData?.groupName) {
      return res.status(200).json({ _id: chatData._id });
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, selectedUserId] },
    });

    console.log(chat);

    if (!chat) {
      chat = new Chat({
        participants: [userId, selectedUserId],
        type: "message",
        lastMessage: { messageId: null },
        timeStamp: new Date(),
        status: false,
        readAt: null,
        isDeleted: false,
      });

      await chat.save();
    } else {
      const latestMessage: any = await Message.findOne({
        chatId: chat._id,
      })
        .sort({ timeStamp: -1 })
        .select("_id");

      if (latestMessage) {
        chat.lastMessage.messageId = latestMessage._id;
        await chat.save();
      }
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error creating or fetching chat:", error);
    res.status(500).json({ error: "Failed to create or get chat" });
  }
};

export const getMessagesByChatId = async (req: CustomRequest, res: Response) => {
  const { chatId } = req.params;
  console.log(`chatID ${chatId}`);
  const CurrentuserId = req.currentUser?.id;
  try {
    const messages = await Message.find({ chatId }).sort({ timeStamp: 1 });
    if (!messages) {
      return res.status(404).json({ message: "Messages not found" });
    }
    await Promise.all(
      messages.map(async (msg) => {
        if (msg.senderId.toString() !== CurrentuserId && !msg.ReadStatus) {
          msg.ReadStatus = true;
          await msg.save(); 
        }
      })
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const chats = async (req: CustomRequest, res: Response) => {
  try {
    const currentUserId = req.currentUser?.id;

    const chats = await Chat.find({
      participants: currentUserId,
    })
      .populate("lastMessage.messageId", "senderName timeStamp", "Message")
      .populate("participants", "_id username profilePicture", "users");
    const users = chats
      .map((chat) => {
        const lastMessage = chat.lastMessage?.messageId || null;
        if (chat.groupName) {
          return chat;
        } else {
          const participants = chat.participants as unknown as IUser[];
          const otherUser = participants.find(
            (participant) => participant._id.toString() !== currentUserId
          );
          return {
            ...otherUser?.toObject(),
            chatId: chat._id,
            lastMessage,
          };
        }
      })
      .filter(Boolean);
    res.json(users);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ message: "Error fetching user chats" });
  }
};

export const getGroupDetails = async (req: Request, res: Response) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).populate(
      "participants",
      "username profilePicture",
      "users"
    );
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const leaveGroup = async (req: CustomRequest, res: Response) => {
  const { chatId } = req.params;
  const userId = req.currentUser?.id;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.participants = chat.participants.filter(
      (participantId) => participantId.toString() !== userId
    );

    await chat.save();

    res.status(200).json({ message: "Successfully left the group" });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const makeAdmin = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { newAdminId } = req.body;
    const currentUserId: any = req.currentUser?.id;
    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.admin.includes(currentUserId)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to assign a new admin" });
    }

    if (!group.participants.includes(newAdminId)) {
      return res
        .status(400)
        .json({ error: "New admin must be a participant in the group" });
    }
    if (!Array.isArray(group.admin)) {
      group.admin = [group.admin];
    }

    if (!group.admin.includes(newAdminId)) {
      group.admin.push(newAdminId);
      await group.save();
    }

    res.status(200).json({ message: "Admin updated successfully", group });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
};

export const removeParticipant = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { participantId } = req.body;
    const currentUserId: any = req.currentUser?.id;
    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.admin.includes(currentUserId)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to remove participants" });
    }

    if (!group.participants.includes(participantId)) {
      return res
        .status(400)
        .json({ error: "Participant is not a member of the group" });
    }

    group.participants = group.participants.filter(
      (id) => id.toString() !== participantId
    );
    if (group.admin.includes(participantId)) {
      group.admin = group.admin.filter((id) => id.toString() !== participantId);
    }

    await group.save();

    res
      .status(200)
      .json({ message: "Participant removed successfully", group });
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ error: "Failed to remove participant" });
  }
};

export const searchUsers = async (req: CustomRequest, res: Response) => {
  try {
    const searchTerm = req.params.searchTerm;
    const users = await UserModel.find({
      $or: [{ username: { $regex: searchTerm, $options: "i" } }],
    }).select("_id username profilePicture");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

export const addParticipant = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { newParticipantId } = req.body;
    const currentUserId: any = req.currentUser?.id;
    const group = await Chat.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.admin.includes(currentUserId)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add participants" });
    }

    if (!group.participants.includes(newParticipantId)) {
      group.participants.push(newParticipantId);
      await group.save();
    }

    res.status(200).json({ message: "Participant added successfully", group });
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ error: "Failed to add participant" });
  }
};
