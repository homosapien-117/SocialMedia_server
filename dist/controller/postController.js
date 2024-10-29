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
exports.deleteImage = exports.addComment = exports.likePost = exports.createReport = exports.deletePost = exports.editPost = exports.getAllPosts = exports.getUserPosts = exports.createPost = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const dotenv_1 = __importDefault(require("dotenv"));
const postModel_1 = __importDefault(require("../models/postModel"));
const userModel_1 = require("../models/userModel");
const reportModel_1 = __importDefault(require("../models/reportModel"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
dotenv_1.default.config();
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_APIKEY,
    api_secret: process.env.CLOUD_APISECRET,
});
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.headers.authorization;
        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const decoded = jsonwebtoken_1.default.decode(token);
        req.body.userId = decoded.id;
        const user = yield userModel_1.UserModel.findById(decoded.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        req.body.username = user.username;
        req.body.userProfilePicture = user.profilePicture;
        const images = req.files;
        console.log(images);
        if (images) {
            const imageUrls = yield Promise.all(images.img.map((image) => cloudinary_1.default.v2.uploader.upload(image.filepath)));
            req.body.img = imageUrls.map((imageUrl) => imageUrl.secure_url);
        }
        const newPost = new postModel_1.default(req.body);
        const savedPost = yield newPost.save();
        res.status(200).json(savedPost);
    }
    catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});
exports.createPost = createPost;
const getUserPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield postModel_1.default.find({
            userId: req.params.userId,
        });
        res.status(200).json(posts);
    }
    catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});
exports.getUserPosts = getUserPosts;
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const posts = yield postModel_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .exec();
        res.status(200).json(posts);
    }
    catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllPosts = getAllPosts;
const editPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.postId;
        const post = yield postModel_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const updateFields = {};
        if (req.body.desc) {
            updateFields.desc = req.body.desc;
        }
        if (req.files && req.files.image) {
            const images = req.files.image;
            const newImageUrls = yield Promise.all(images.map((image) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield cloudinary_1.default.v2.uploader.upload(image.filepath);
                return result.secure_url;
            })));
            updateFields.img = [...(post.img || []), ...newImageUrls];
        }
        if (Object.keys(updateFields).length > 0) {
            yield postModel_1.default.updateOne({ _id: postId }, { $set: updateFields });
        }
        const updatedPost = yield postModel_1.default.findById(postId);
        res.status(200).json(updatedPost);
    }
    catch (err) {
        console.error("Error updating post:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.editPost = editPost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const postId = req.params.postId;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const post = yield postModel_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.userId !== currentUserId) {
            return res
                .status(403)
                .json({ message: "You can only delete your own posts" });
        }
        yield post.deleteOne();
        res.status(200).json("Post deleted");
    }
    catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});
exports.deletePost = deletePost;
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const decoded = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield userModel_1.UserModel.findById(decoded);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const post = yield postModel_1.default.findById(req.params.postId);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const newReport = new reportModel_1.default({
            reason: req.body.reason,
            postId: req.params.postId,
            personId: user._id,
            reportedDatetime: new Date(),
        });
        const savedReport = yield newReport.save();
        res.status(201).json(savedReport);
    }
    catch (err) {
        console.error("Error creating report:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.createReport = createReport;
const likePost = (io) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const postId = req.params.postId;
        const post = yield postModel_1.default.findById(postId);
        console.log(`post: ${post}`);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const alreadyLiked = post.likes.includes(userId);
        if (alreadyLiked) {
            post.likes = post.likes.filter((id) => id !== userId);
            res.status(200).json(post);
        }
        else {
            post.likes.push(userId);
            const firstImage = Array.isArray(post.img) && post.img.length > 0 ? post.img[0] : undefined;
            const notification = new notificationModel_1.default({
                userId: post.userId,
                postImage: firstImage,
                type: "like",
                content: `${(_b = (yield userModel_1.UserModel.findById(userId))) === null || _b === void 0 ? void 0 : _b.username} liked your post`,
                postId: post._id,
                createdAt: new Date(),
            });
            yield notification.save();
            res.status(200).json({ notification });
        }
        yield post.save();
    }
    catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});
exports.likePost = likePost;
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield userModel_1.UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const postId = req.params.postId;
        const post = yield postModel_1.default.findById(postId);
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
        yield post.save();
        const notification = new notificationModel_1.default({
            userId: post.userId,
            type: "comment",
            content: `${user.username} commented on your post`,
            postId: post._id,
            createdAt: new Date(),
        });
        yield notification.save();
        res.status(200).json({ post, notification });
    }
    catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.addComment = addComment;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const postId = req.params.postId;
        const { imageUrl } = req.body;
        const post = yield postModel_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.userId !== currentUserId) {
            return res
                .status(403)
                .json({ message: "You can only edit your own posts" });
        }
        const publicId = ((_b = imageUrl.split("/").pop()) === null || _b === void 0 ? void 0 : _b.split(".")[0]) || "";
        yield cloudinary_1.default.v2.uploader.destroy(publicId);
        post.img = ((_c = post.img) === null || _c === void 0 ? void 0 : _c.filter((img) => img !== imageUrl)) || [];
        yield post.save();
        res.status(200).json(post);
    }
    catch (err) {
        console.error("Error deleting image:", err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.deleteImage = deleteImage;
