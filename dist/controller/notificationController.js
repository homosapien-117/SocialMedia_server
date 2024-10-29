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
exports.declineFollowRequest = exports.approveFollowRequest = exports.getNotifications = void 0;
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const userModel_1 = require("../models/userModel");
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const notifications = yield notificationModel_1.default.find({ userId }).sort({
            createdAt: -1,
        });
        res.status(200).json(notifications);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getNotifications = getNotifications;
const approveFollowRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { notificationId } = req.params;
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const notification = yield notificationModel_1.default.findById(notificationId);
        if (!notification ||
            notification.userId.toString() !== userId ||
            notification.type !== "follow") {
            return res.status(404).json("Follow request not found");
        }
        const followingUserId = notification.content.split(" ")[0];
        const followingUser = yield userModel_1.UserModel.findOne({
            username: followingUserId,
        });
        if (!followingUser) {
            yield notification.deleteOne();
            return res.status(404).json("Following user not found");
        }
        const currentUser = yield userModel_1.UserModel.findById(userId);
        if (!currentUser.requests.includes(followingUser._id)) {
            yield notification.deleteOne();
            return res.status(200).json("User deleted the follow request");
        }
        yield userModel_1.UserModel.findByIdAndUpdate(userId, {
            $addToSet: { followers: followingUser._id },
        });
        yield userModel_1.UserModel.findByIdAndUpdate(followingUser._id, {
            $addToSet: { following: userId },
        });
        yield notification.deleteOne();
        res.status(200).json("Follow request approved");
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.approveFollowRequest = approveFollowRequest;
const declineFollowRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { notificationId } = req.params;
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const notification = yield notificationModel_1.default.findById(notificationId);
        if (!notification ||
            notification.userId.toString() !== userId ||
            notification.type !== "follow") {
            return res.status(404).json("Follow request not found");
        }
        const followingUsername = notification.content.split(" ")[0];
        const followingUser = yield userModel_1.UserModel.findOne({
            username: followingUsername,
        });
        if (!followingUser) {
            return res.status(404).json("Following user not found");
        }
        yield userModel_1.UserModel.findByIdAndUpdate(userId, {
            $pull: { requests: followingUser._id },
        });
        yield notification.deleteOne();
        res.status(200).json("Follow request declined");
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.declineFollowRequest = declineFollowRequest;
