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
exports.initializeSocketIO = initializeSocketIO;
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function initializeSocketIO(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log(`A user connected: ${socket.id}`);
        socket.on("register", (userId) => {
            socket.join(userId);
            console.log("user joined the room" + userId);
            socket.emit("connected");
        });
        socket.on("liked post", (notification) => {
            if (notification) {
                socket.to(notification.userId).emit("newLike", notification);
                console.log('socket send from backend');
            }
        });
        socket.on("comment", (notification) => {
            if (notification) {
                socket.to(notification.userId).emit("newComment", notification);
            }
        });
        socket.on("sendMessage", (message) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received message for saving:", message);
            try {
                socket.to(message.chatId).emit("receiveMessage", message);
                console.log("Message saved and broadcasted:", message);
            }
            catch (error) {
                console.error("Error handling message:", error);
            }
        }));
        socket.on("JoinRoom", (chatId) => {
            socket.join(chatId);
            console.log("joined chat room");
        });
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
    return io;
}
