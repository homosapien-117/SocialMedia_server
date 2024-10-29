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
exports.unblockPost = exports.blockPost = exports.getReportDetails = exports.getReportedPosts = exports.edituser = exports.deleteuser = exports.unblockuser = exports.blockuser = exports.getAllUser = void 0;
const userModel_1 = require("../models/userModel");
const reportModel_1 = __importDefault(require("../models/reportModel"));
const postModel_1 = __importDefault(require("../models/postModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const getAllUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 6;
        const skip = (page - 1) * limit;
        const users = yield userModel_1.UserModel.find({ username: { $ne: "Admin" } }, { password: 0 })
            .skip(skip)
            .limit(limit)
            .exec();
        const totalUsers = yield userModel_1.UserModel.countDocuments({ username: { $ne: "Admin" } }).exec();
        const totalPages = Math.ceil(totalUsers / limit);
        res.status(200).json({ users, totalPages });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: String(error) });
        }
    }
});
exports.getAllUser = getAllUser;
const blockuser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield userModel_1.UserModel.findByIdAndUpdate(req.params.id, {
            $set: { blocked: true },
        }).exec();
        res.status(200).json("Account Blocked Successfully");
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: String(error) });
        }
    }
});
exports.blockuser = blockuser;
const unblockuser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield userModel_1.UserModel.findByIdAndUpdate(req.params.id, {
            $set: { blocked: false },
        }).exec();
        res.status(200).json("Account UNBlocked Successfully");
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: String(error) });
        }
    }
});
exports.unblockuser = unblockuser;
const deleteuser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    console.log(id);
    try {
        yield userModel_1.UserModel.findByIdAndDelete(id).exec();
        res.status(200).json("user Deleted");
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: String(error) });
        }
    }
});
exports.deleteuser = deleteuser;
const edituser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { username, email } = req.body;
    console.log(username);
    try {
        const updatedUser = yield userModel_1.UserModel.findByIdAndUpdate(id, { $set: { username, email } }, { new: true }).exec();
        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error("Error updating user:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: String(error) });
        }
    }
});
exports.edituser = edituser;
const getReportedPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = {
            $or: [
                { reason: new RegExp(search, "i") },
                { 'post.desc': new RegExp(search, "i") },
                { 'reportedUser.username': new RegExp(search, "i") }
            ]
        };
        console.log(query);
        const reports = yield reportModel_1.default.find(query)
            .skip(skip)
            .limit(Number(limit))
            .exec();
        const detailedReports = yield Promise.all(reports.map((report) => __awaiter(void 0, void 0, void 0, function* () {
            const post = yield postModel_1.default.findById(report.postId).exec();
            const postOwner = yield userModel_1.UserModel.findById(post === null || post === void 0 ? void 0 : post.userId).exec();
            const reportedUser = yield userModel_1.UserModel.findById(report.personId).exec();
            return Object.assign(Object.assign({}, report.toObject()), { post,
                reportedUser,
                postOwner });
        })));
        const totalReports = yield reportModel_1.default.countDocuments(query).exec();
        res.status(200).json({
            reports: detailedReports,
            total: totalReports,
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.getReportedPosts = getReportedPosts;
const getReportDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: "Invalid post ID" });
            return;
        }
        const reports = yield reportModel_1.default.find({ postId: postId }).exec();
        if (reports.length === 0) {
            res
                .status(404)
                .json({ message: "No reports found for the given post ID" });
            return;
        }
        const detailedReports = yield Promise.all(reports.map((report) => __awaiter(void 0, void 0, void 0, function* () {
            const post = yield postModel_1.default.findById(report.postId).exec();
            const postOwner = yield userModel_1.UserModel.findById(post === null || post === void 0 ? void 0 : post.userId).exec();
            const reportedUser = yield userModel_1.UserModel.findById(report.personId).exec();
            return {
                report: {
                    reason: report.reason,
                    reportedDatetime: report.reportedDatetime,
                },
                post: {
                    description: post === null || post === void 0 ? void 0 : post.desc,
                    images: post === null || post === void 0 ? void 0 : post.img,
                },
                postOwner: {
                    username: postOwner === null || postOwner === void 0 ? void 0 : postOwner.username,
                    email: postOwner === null || postOwner === void 0 ? void 0 : postOwner.email,
                },
                reportedUser: {
                    username: reportedUser === null || reportedUser === void 0 ? void 0 : reportedUser.username,
                    email: reportedUser === null || reportedUser === void 0 ? void 0 : reportedUser.email,
                },
            };
        })));
        res.status(200).json(detailedReports);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.getReportDetails = getReportDetails;
const blockPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.postId;
        if (!mongoose_1.default.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: "Invalid post ID" });
            return;
        }
        const post = yield postModel_1.default.findByIdAndUpdate(postId, { blocked: true }, { new: true }).exec();
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json({ message: "Post blocked successfully", post });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.blockPost = blockPost;
const unblockPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const postId = req.params.postId;
        if (!mongoose_1.default.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ message: "Invalid post ID" });
            return;
        }
        const post = yield postModel_1.default.findByIdAndUpdate(postId, { blocked: false }, { new: false }).exec();
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.status(200).json({ message: "Post blocked successfully", post });
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.unblockPost = unblockPost;
const handleError = (res, error) => {
    if (error instanceof Error) {
        res.status(500).json({ error: error.message });
    }
    else {
        res.status(500).json({ error: String(error) });
    }
};
