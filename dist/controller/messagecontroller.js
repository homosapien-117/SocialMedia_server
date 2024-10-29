"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addParticipant = exports.searchUsers = exports.removeParticipant = exports.makeAdmin = exports.leaveGroup = exports.getGroupDetails = exports.chats = exports.getMessagesByChatId = exports.createOrGetChat = exports.sendMessage = exports.getChatMessages = exports.createGroupChat = exports.searchChat = void 0;
const userModel_1 = require("../models/userModel");
const messageModel_1 = __importDefault(require("../models/messageModel"));
const chatModel_1 = __importDefault(require("../models/chatModel"));
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = __importDefault(require("cloudinary"));
dotenv_1.default.config();
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_APIKEY,
    api_secret: process.env.CLOUD_APISECRET,
});
const searchChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const searchTerm = req.params.searchTerm.toLowerCase();
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        if (!searchTerm) {
            return res.json([]);
        }
        const currentUser = yield userModel_1.UserModel.findById(currentUserId).select("followers following");
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const followers = yield Promise.all(currentUser.followers.map((follower) => userModel_1.UserModel.findById(typeof follower === "object" ? follower._id || follower.id : follower).select("username profilePicture")));
        const following = yield Promise.all(currentUser.following.map((following) => userModel_1.UserModel.findById(typeof following === "object"
            ? following._id || following.id
            : following).select("username profilePicture")));
        const uniqueUsers = new Map();
        [...followers, ...following].forEach((user) => {
            if (user) {
                uniqueUsers.set(user._id.toString(), {
                    _id: user._id,
                    username: user.username,
                    profilePicture: user.profilePicture,
                });
            }
        });
        const relevantUsers = Array.from(uniqueUsers.values()).filter((user) => user.username.toLowerCase().includes(searchTerm));
        res.json(relevantUsers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.searchChat = searchChat;
const createGroupChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { groupName, participants } = req.body;
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !groupName || participants.length === 0) {
            return res
                .status(400)
                .json({ error: "Group name and participants are required" });
        }
        const newChat = new chatModel_1.default({
            participants: [userId, ...participants],
            groupName,
            admin: userId,
            lastMessage: { messageId: null },
            timeStamp: new Date(),
            status: false,
            readAt: null,
            isDeleted: false,
        });
        yield newChat.save();
        res.status(201).json(newChat);
    }
    catch (error) {
        console.error("Error creating group chat:", error);
        res.status(500).json({ error: "Failed to create group chat" });
    }
});
exports.createGroupChat = createGroupChat;
const getChatMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId } = req.query;
    console.log(userId);
    const loggedInUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const user = yield userModel_1.UserModel.findOne({ _id: loggedInUserId });
        const chat = yield chatModel_1.default.findOne({ _id: userId })
            .populate("participants", "username profilePicture")
            .exec();
        if (!user) {
            return res.status(404).json({ message: "Chat not found" });
        }
        if (chat === null || chat === void 0 ? void 0 : chat.groupName) {
            return res.json({
                _id: chat._id,
                groupName: chat.groupName,
                participants: chat.participants,
            });
        }
        else {
            res.json({
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            });
        }
    }
    catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getChatMessages = getChatMessages;
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { chatId, content, senderName } = req.body;
    const senderId = req.body.senderId;
    const image = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
    const document = (_b = req.files) === null || _b === void 0 ? void 0 : _b.document;
    try {
        let imageUrl = "";
        let documentUrl = "";
        if (image) {
            if (Array.isArray(image)) {
                imageUrl = yield Promise.all(image.map((img) => __awaiter(void 0, void 0, void 0, function* () {
                    const result = yield cloudinary_1.default.v2.uploader.upload(img.filepath);
                    return result.secure_url;
                })));
            }
            else {
                const result = yield cloudinary_1.default.v2.uploader.upload(image.filepath);
                imageUrl = result.secure_url;
            }
        }
        // Handle document upload
        if (document) {
            console.log("Document file to upload:", document); // Debug: Log document file details
            if (Array.isArray(document)) {
                documentUrl = yield Promise.all(document.map((doc) => __awaiter(void 0, void 0, void 0, function* () {
                    const result = yield cloudinary_1.default.v2.uploader.upload(doc.filepath, {
                        resource_type: "raw", // Specify raw file type for non-image files
                    });
                    console.log(result);
                    documentUrl = result.secure_url;
                    return result.secure_url;
                })));
            }
            else {
                const result = yield cloudinary_1.default.v2.uploader.upload(document.filepath, {
                    resource_type: "raw",
                });
                documentUrl = result.secure_url;
            }
        }
        const newMessage = new messageModel_1.default({
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
        yield newMessage.save();
        res.status(201).json(newMessage);
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.sendMessage = sendMessage;
const createOrGetChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { selectedUserId } = req.body;
        console.log(selectedUserId);
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const chatData = yield chatModel_1.default.findOne({ _id: selectedUserId });
        console.log(`chatData: ${chatData}`);
        if (chatData === null || chatData === void 0 ? void 0 : chatData.groupName) {
            return res.status(200).json({ _id: chatData._id });
        }
        let chat = yield chatModel_1.default.findOne({
            participants: { $all: [userId, selectedUserId] },
        });
        console.log(chat);
        if (!chat) {
            chat = new chatModel_1.default({
                participants: [userId, selectedUserId],
                type: "message",
                lastMessage: { messageId: null },
                timeStamp: new Date(),
                status: false,
                readAt: null,
                isDeleted: false,
            });
            yield chat.save();
        }
        else {
            const latestMessage = yield messageModel_1.default.findOne({
                chatId: chat._id,
            })
                .sort({ timeStamp: -1 })
                .select("_id");
            if (latestMessage) {
                chat.lastMessage.messageId = latestMessage._id;
                yield chat.save();
            }
        }
        res.status(200).json(chat);
    }
    catch (error) {
        console.error("Error creating or fetching chat:", error);
        res.status(500).json({ error: "Failed to create or get chat" });
    }
});
exports.createOrGetChat = createOrGetChat;
const getMessagesByChatId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    console.log(`chatID ${chatId}`);
    try {
        const messages = yield messageModel_1.default.find({ chatId }).sort({ timeStamp: 1 });
        console.log(messages);
        if (!messages) {
            return res.status(404).json({ message: "Messages not found" });
        }
        res.status(200).json(messages);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getMessagesByChatId = getMessagesByChatId;
const chats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const chats = yield chatModel_1.default.find({
            participants: currentUserId,
        }).populate("participants", "_id username profilePicture", "users");
        const users = chats
            .map((chat) => {
            if (chat.groupName) {
                return chat;
            }
            else {
                const participants = chat.participants;
                return participants.find((participant) => participant._id.toString() !== currentUserId);
            }
        })
            .filter(Boolean);
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching user chats:", error);
        res.status(500).json({ message: "Error fetching user chats" });
    }
});
exports.chats = chats;
const getGroupDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    try {
        const chat = yield chatModel_1.default.findById(chatId).populate("participants", "username profilePicture", "users");
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }
        res.status(200).json(chat);
    }
    catch (error) {
        console.error("Error fetching group details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getGroupDetails = getGroupDetails;
const leaveGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { chatId } = req.params;
    const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const chat = yield chatModel_1.default.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }
        chat.participants = chat.participants.filter((participantId) => participantId.toString() !== userId);
        yield chat.save();
        res.status(200).json({ message: "Successfully left the group" });
    }
    catch (error) {
        console.error("Error leaving group:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.leaveGroup = leaveGroup;
const makeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { groupId } = req.params;
        const { newAdminId } = req.body;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const group = yield chatModel_1.default.findById(groupId);
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
            yield group.save();
        }
        res.status(200).json({ message: "Admin updated successfully", group });
    }
    catch (error) {
        console.error("Error updating admin:", error);
        res.status(500).json({ error: "Failed to update admin" });
    }
});
exports.makeAdmin = makeAdmin;
const removeParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { groupId } = req.params;
        const { participantId } = req.body;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const group = yield chatModel_1.default.findById(groupId);
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
        group.participants = group.participants.filter((id) => id.toString() !== participantId);
        if (group.admin.includes(participantId)) {
            group.admin = group.admin.filter((id) => id.toString() !== participantId);
        }
        yield group.save();
        res
            .status(200)
            .json({ message: "Participant removed successfully", group });
    }
    catch (error) {
        console.error("Error removing participant:", error);
        res.status(500).json({ error: "Failed to remove participant" });
    }
});
exports.removeParticipant = removeParticipant;
const searchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.params.searchTerm;
        const users = yield userModel_1.UserModel.find({
            $or: [{ username: { $regex: searchTerm, $options: "i" } }],
        }).select("_id username profilePicture");
        res.status(200).json(users);
    }
    catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Failed to search users" });
    }
});
exports.searchUsers = searchUsers;
const addParticipant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { groupId } = req.params;
        const { newParticipantId } = req.body;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const group = yield chatModel_1.default.findById(groupId);
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
            yield group.save();
        }
        res.status(200).json({ message: "Participant added successfully", group });
    }
    catch (error) {
        console.error("Error adding participant:", error);
        res.status(500).json({ error: "Failed to add participant" });
    }
});
exports.addParticipant = addParticipant;
