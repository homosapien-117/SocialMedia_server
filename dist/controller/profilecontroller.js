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
exports.unblockUser = exports.blockUser = exports.getFollowers = exports.getFollowing = exports.cancelRequest = exports.unfollowUser = exports.followUser = exports.getUserProfile = exports.search = exports.status = exports.updateProfileDetails = exports.uploadProfilePicture = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const fs_1 = __importDefault(require("fs"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const postModel_1 = __importDefault(require("../models/postModel"));
dotenv_1.default.config();
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_APIKEY,
    api_secret: process.env.CLOUD_APISECRET,
});
////////////////////////////////////////////uploadProfilePicture/////////////////////////////////////////////////////
const uploadProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        const User = jsonwebtoken_1.default.verify(token, "secretkey123");
        const image = (_a = req.files) === null || _a === void 0 ? void 0 : _a.img;
        if (!image || !Array.isArray(image) || image.length === 0) {
            return res.status(400).json({ message: "No image provided" });
        }
        const filePath = image[0].filepath;
        console.log("File path:", filePath);
        const imageUrl = yield cloudinary_1.default.v2.uploader.upload(filePath);
        console.log("Image URL:", imageUrl.secure_url);
        fs_1.default.unlinkSync(filePath);
        const updatedUser = yield userModel_1.UserModel.findByIdAndUpdate(User.id, { profilePicture: imageUrl.secure_url }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(updatedUser);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});
exports.uploadProfilePicture = uploadProfilePicture;
////////////////////////////////////////////updateProfileDetails/////////////////////////////////////////////////////
const updateProfileDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const { name, bio } = req.body;
        if (!name || !bio) {
            return res
                .status(400)
                .json({ message: "Please provide both name and bio" });
        }
        const username = name;
        const updatedUser = yield userModel_1.UserModel.findByIdAndUpdate(userId, { username, bio }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(updatedUser);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});
exports.updateProfileDetails = updateProfileDetails;
////////////////////////////////////////////status (Private/public)/////////////////////////////////////////////////////
const status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const { isPrivate } = req.body;
        const updatedUser = yield userModel_1.UserModel.findByIdAndUpdate(userId, { isPrivate }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(updatedUser);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});
exports.status = status;
////////////////////////////////////////////search/////////////////////////////////////////////////////
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const searchTerm = req.params.searchTerm.toLowerCase();
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const results = yield userModel_1.UserModel.find({
            username: new RegExp(searchTerm, "i"),
            _id: { $ne: currentUserId },
            isAdmin: { $ne: true },
        }, "username _id email profilePicture isPrivate");
        res.json(results);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.search = search;
////////////////////////////////////////////getUserProfile/////////////////////////////////////////////////////
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.params;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield userModel_1.UserModel.findById(userId).select("username email profilePicture isPrivate bio followers following blockedMe");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log(user.followers);
        let posts = [];
        if (!user.isPrivate ||
            (user.isPrivate && ((_b = user.followers) === null || _b === void 0 ? void 0 : _b.includes(currentUserId)))) {
            posts = yield postModel_1.default.find({ userId: userId, blocked: false }).exec();
            console.log(posts);
        }
        res.status(200).json({ user, posts });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getUserProfile = getUserProfile;
////////////////////////////////////////////followUser/////////////////////////////////////////////////////
const followUser = (io) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const id = req.params.id;
    const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
    if (currentUserId === id) {
        res.status(403).json("Request forbidden");
        return;
    }
    try {
        const followUser = yield userModel_1.UserModel.findById(id);
        const followingUser = yield userModel_1.UserModel.findById(currentUserId);
        if (!followUser || !followingUser) {
            res.status(404).json("User not found");
            return;
        }
        if (followUser.isPrivate) {
            const notification = new notificationModel_1.default({
                userId: followUser._id,
                type: "follow",
                content: `${followingUser.username} wants to follow you`,
                postId: null,
            });
            yield notification.save();
            yield followUser.updateOne({ $push: { requests: currentUserId } });
            io.to(followUser._id.toString()).emit("notification", notification);
            res.status(200).json("Follow request sent");
        }
        else {
            if (!((_b = followUser === null || followUser === void 0 ? void 0 : followUser.followers) === null || _b === void 0 ? void 0 : _b.includes(currentUserId))) {
                yield followUser.updateOne({ $push: { followers: currentUserId } });
                yield followingUser.updateOne({ $push: { following: id } });
                res.status(200).json("User Followed");
            }
            else {
                res.status(403).json("User is already being followed");
            }
        }
    }
    catch (err) {
        res.status(500).json(err);
    }
});
exports.followUser = followUser;
////////////////////////////////////////////unfollowUser/////////////////////////////////////////////////////
const unfollowUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id: userId } = req.params;
    try {
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId === userId) {
            res.status(403).json("You can't unfollow yourself");
            return;
        }
        const user = yield userModel_1.UserModel.findById(userId);
        const currentUser = yield userModel_1.UserModel.findById(currentUserId);
        if (!user || !currentUser) {
            res.status(404).json("User not found");
            return;
        }
        user.followers = (_b = user.followers) !== null && _b !== void 0 ? _b : [];
        currentUser.following = (_c = currentUser.following) !== null && _c !== void 0 ? _c : [];
        if (user.followers.includes(currentUserId)) {
            yield user.updateOne({ $pull: { followers: currentUserId } });
            yield currentUser.updateOne({ $pull: { following: userId } });
            res.status(200).json("User has been unfollowed");
        }
        else {
            res.status(403).json("You are not following this user");
        }
    }
    catch (err) {
        res.status(500).json(err);
    }
});
exports.unfollowUser = unfollowUser;
const cancelRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.params;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield userModel_1.UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!((_b = user === null || user === void 0 ? void 0 : user.requests) === null || _b === void 0 ? void 0 : _b.includes(currentUserId))) {
            res.status(400).json({ message: "No follow request to cancel" });
            return;
        }
        user.requests = user.requests.filter((id) => id.toString() !== currentUserId);
        yield user.save();
        res.status(200).json({ message: "Follow request canceled successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.cancelRequest = cancelRequest;
///////////////////////////////////////////getFollowing///////////////////////////////////////////////
const getFollowing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield userModel_1.UserModel.findById(req.params.id);
        if (!user || !user.following) {
            res.status(404).json({ message: "User not found or no following" });
            return;
        }
        const following = yield Promise.all(user.following.map((followingId) => userModel_1.UserModel.findById(followingId)));
        const followingList = following
            .filter((following) => following != null)
            .map((following) => ({
            _id: following._id,
            username: following.username,
            profilePicture: following.profilePicture,
        }));
        res.status(200).json(followingList);
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err });
    }
});
exports.getFollowing = getFollowing;
///////////////////////////////////////////getFollowers///////////////////////////////////////////////
const getFollowers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield userModel_1.UserModel.findById(req.params.id);
        if (!user || !user.followers) {
            res.status(404).json({ message: "User not found or no followers" });
            return;
        }
        const followers = yield Promise.all(user.followers.map((followerId) => userModel_1.UserModel.findById(followerId)));
        const followerList = followers
            .filter((follower) => follower != null)
            .map((follower) => ({
            _id: follower._id,
            username: follower.username,
            profilePicture: follower.profilePicture,
        }));
        res.status(200).json(followerList);
    }
    catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err });
    }
});
exports.getFollowers = getFollowers;
////////////////////////////////////////////blockUser/////////////////////////////////////////////////////
const blockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { userId } = req.params;
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId === userId) {
            return res.status(403).json({ message: "You cannot block yourself" });
        }
        const currentUser = yield userModel_1.UserModel.findById(currentUserId);
        const userToBlock = yield userModel_1.UserModel.findById(userId);
        if (!currentUser || !userToBlock) {
            return res.status(404).json({ message: "User not found" });
        }
        if ((_b = currentUser.blockedUsers) === null || _b === void 0 ? void 0 : _b.includes(userId)) {
            return res.status(400).json({ message: "User is already blocked" });
        }
        (_c = currentUser.blockedUsers) === null || _c === void 0 ? void 0 : _c.push(userId);
        (_d = userToBlock.blockedMe) === null || _d === void 0 ? void 0 : _d.push(currentUserId);
        yield currentUser.save();
        yield userToBlock.save();
        res.status(200).json({ message: "User blocked successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});
exports.blockUser = blockUser;
///////////////////////////////////////////////unblockUser///////////////////////////////////////////////////////
const unblockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const currentUserId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const { userId } = req.params;
        if (currentUserId === userId) {
            return res.status(403).json({ message: "You cannot unblock yourself" });
        }
        const currentUser = yield userModel_1.UserModel.findById(currentUserId);
        const userToUnblock = yield userModel_1.UserModel.findById(userId);
        if (!currentUser || !userToUnblock) {
            return res.status(404).json({ message: "User not found" });
        }
        currentUser.blockedUsers = (_b = currentUser.blockedUsers) === null || _b === void 0 ? void 0 : _b.filter((id) => id !== userId);
        userToUnblock.blockedMe = (_c = userToUnblock.blockedMe) === null || _c === void 0 ? void 0 : _c.filter((id) => id !== currentUserId);
        yield currentUser.save();
        yield userToUnblock.save();
        res.status(200).json({ message: "User unblocked successfully" });
    }
    catch (err) {
        console.error("Error unblocking user:", err);
        res.status(500).json({ message: "Server Error", error: err });
    }
});
exports.unblockUser = unblockUser;
