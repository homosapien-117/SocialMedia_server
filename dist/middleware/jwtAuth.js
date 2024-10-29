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
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secretKey = process.env.JWT_SECRETKEY;
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json("Token not provided");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        req.currentUser = { id: decoded.id };
        const user = yield userModel_1.UserModel.findById(decoded.id);
        if ((user === null || user === void 0 ? void 0 : user.blocked) == false) {
            next();
        }
        else {
            console.log("hey you are blocked");
            return res
                .status(403)
                .json({ error: "User is blocked. Please log out." });
        }
    }
    catch (err) {
        return res.status(400).json("Invalid token");
    }
});
exports.authenticateToken = authenticateToken;
