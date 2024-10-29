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
exports.getUserRegistrationStats = exports.getTimelinePost = exports.adminlogin = exports.resetPassword = exports.forgotPassword = exports.login = exports.verifyEmail = exports.signup = void 0;
const userModel_1 = require("../models/userModel");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const http_errors_1 = __importDefault(require("http-errors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendmail_1 = require("../utils/sendmail");
const forgotmail_1 = require("../utils/forgotmail");
const postModel_1 = __importDefault(require("../models/postModel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
////////////////////Signup////////////////////////////
exports.signup = [
    (0, express_validator_1.body)("username").notEmpty().withMessage("Username is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Email is not valid"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, express_validator_1.body)("confirmpassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    }),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            console.log(req.body);
            const existingEmailUser = yield userModel_1.UserModel.findOne({
                email: req.body.email,
            });
            const existingUsernameUser = yield userModel_1.UserModel.findOne({
                username: req.body.username,
            });
            if (existingEmailUser) {
                return next(new http_errors_1.default.BadRequest("Email already in use!"));
            }
            if (existingUsernameUser) {
                return next(new http_errors_1.default.BadRequest("Username already taken!"));
            }
            const hashedPassword = yield bcryptjs_1.default.hash(req.body.password, 12);
            const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
            const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
            const newUser = yield userModel_1.UserModel.create(Object.assign(Object.assign({}, req.body), { password: hashedPassword, verificationToken,
                verificationTokenExpires, isVerified: false }));
            const verificationLink = `${process.env.EMAILVARIFICATIONLINK}${verificationToken}`;
            (0, sendmail_1.sendEmailtoUser)(verificationLink, newUser.email);
            res.status(201).json({
                status: "success",
                message: "User registered successfully",
                verificationToken,
            });
        }
        catch (error) {
            next(error);
            console.log(error);
        }
    }),
];
////////////////////Email verification////////////////////////////
const verifyEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req);
        const verificationToken = req.params.token;
        console.log(verificationToken);
        const user = yield userModel_1.UserModel.findOne({
            verificationToken,
            verificationTokenExpires: { $gt: Date.now() },
        });
        if (!user) {
            return next(new http_errors_1.default.BadRequest("Token is invalid or has expired"));
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        yield user.save();
        res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    }
    catch (error) {
        next(error);
    }
});
exports.verifyEmail = verifyEmail;
////////////////////Login////////////////////////////
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield userModel_1.UserModel.findOne({
            email,
            blocked: false,
            isVerified: true,
            isAdmin: false,
        });
        if (!user) {
            return next(new http_errors_1.default.BadRequest("User not found or Blocked by admin"));
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new http_errors_1.default.BadRequest("Password incorrect"));
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, "secretkey123", {
            expiresIn: "90d",
        });
        res.status(200).json({
            status: "success",
            message: "Logged in successfully",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                following: user.following,
                followers: user.followers,
                profilePicture: user.profilePicture,
                isPrivate: user.isPrivate
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
////////////////////ForgotPassword////////////////////////////
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield userModel_1.UserModel.findOne({ email });
        if (!user) {
            return res.status(400).send("User with given email does not exist.");
        }
        const token = crypto_1.default.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        yield user.save();
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
        (0, forgotmail_1.sendForgotPasswordEmail)(user.email, resetLink);
        res.status(200).send("Recovery email sent");
    }
    catch (err) {
        console.error("Error during the password reset process:", err);
        next(err);
    }
});
exports.forgotPassword = forgotPassword;
////////////////////resetpassword////////////////////////////
exports.resetPassword = [
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, express_validator_1.body)("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    }),
    (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { token } = req.params;
            const { password } = req.body;
            const user = yield userModel_1.UserModel.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() },
            });
            if (!user) {
                return res
                    .status(400)
                    .send("Password reset token is invalid or has expired.");
            }
            const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            yield user.save();
            res.status(200).send("Password has been reset.");
        }
        catch (err) {
            console.error("Error resetting password:", err);
            next(err);
        }
    }),
];
////////////////////Admin Login////////////////////////////
const adminlogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield userModel_1.UserModel.findOne({ email });
        if (!user) {
            return next(new http_errors_1.default.BadRequest("User not found"));
        }
        console.log("User found:", user);
        const ispasswordvalid = yield bcryptjs_1.default.compare(password, user.password);
        if (!ispasswordvalid) {
            console.log("Password incorrect");
            return next(new http_errors_1.default.BadRequest("Password incorrect"));
        }
        const isAdmin = user.isAdmin;
        if (isAdmin === false) {
            console.log("not admin");
            return next(new http_errors_1.default.BadRequest("Not admin"));
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, "secretkey123", {
            expiresIn: "90d",
        });
        res.status(200).json({
            status: "success",
            token,
            message: "Admin Logged in successfully",
            user: {
                _id: user._id,
                name: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.adminlogin = adminlogin;
const getTimelinePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.id;
        const currentUser = yield userModel_1.UserModel.findById(userId);
        if (!currentUser) {
            return next(new http_errors_1.default.NotFound('User not found'));
        }
        const following = (_b = currentUser.following) !== null && _b !== void 0 ? _b : [];
        const userPosts = yield postModel_1.default.find({ userId: currentUser._id, blocked: false });
        const friendPosts = yield Promise.all(following.map((friendId) => __awaiter(void 0, void 0, void 0, function* () {
            return yield postModel_1.default.find({ userId: friendId, blocked: false });
        })));
        const posts = userPosts.concat(...friendPosts);
        const detailedPosts = yield Promise.all(posts.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const author = yield userModel_1.UserModel.findById(post.userId);
            return Object.assign(Object.assign({}, post.toObject()), { authorName: author === null || author === void 0 ? void 0 : author.username, authorProfilePicture: author === null || author === void 0 ? void 0 : author.profilePicture });
        })));
        detailedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.status(200).json(detailedPosts);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getTimelinePost = getTimelinePost;
const getUserRegistrationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        // Find users registered between startDate and endDate
        const registrations = yield userModel_1.UserModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } }, // Sort by date
        ]);
        res.json({ data: registrations });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching registration stats" });
    }
});
exports.getUserRegistrationStats = getUserRegistrationStats;
