"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = require("http");
const socketIo_1 = require("./services/socketIo");
const authroutes_1 = __importDefault(require("./routes/authroutes"));
const adminroutes_1 = __importDefault(require("./routes/adminroutes"));
const profileroute_1 = __importDefault(require("./routes/profileroute"));
const postroutes_1 = __importDefault(require("./routes/postroutes"));
const notificationroutes_1 = __importDefault(require("./routes/notificationroutes"));
const messageroutes_1 = __importDefault(require("./routes/messageroutes"));
require("./types/express");
dotenv_1.default.config();
console.log("DB_URL:", process.env.DB_URL);
console.log("PORT:", process.env.PORT);
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = (0, socketIo_1.initializeSocketIO)(server);
app.use(body_parser_1.default.json({ limit: "10mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "10mb", extended: true }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
}));
app.use(express_1.default.json());
app.use("/api/auth", authroutes_1.default);
app.use("/api/auth", adminroutes_1.default);
app.use("/api/auth", (req, res, next) => {
    req.io = io;
    next();
}, profileroute_1.default);
app.use("/api/auth", (req, res, next) => {
    req.io = io;
    next();
}, postroutes_1.default);
app.use("/api/auth", notificationroutes_1.default);
app.use("/api/auth", messageroutes_1.default);
const DB_URL = process.env.DB_URL;
mongoose_1.default
    .connect(DB_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Failed to connect to MongoDB", error));
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
exports.default = app;
