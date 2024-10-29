"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admincontroller_1 = require("../controller/admincontroller");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = express_1.default.Router();
router.get("/userlist", jwtAuth_1.authenticateToken, admincontroller_1.getAllUser);
router.put("/block/:id", admincontroller_1.blockuser);
router.put("/unblock/:id", admincontroller_1.unblockuser);
router.delete("/deleteuser/:id", admincontroller_1.deleteuser);
router.put("/edituser/:id", admincontroller_1.edituser);
router.get('/reportedposts', admincontroller_1.getReportedPosts);
router.get("/reportdetails/:postId", admincontroller_1.getReportDetails);
router.post("/blockpost/:postId", admincontroller_1.blockPost);
router.post("/unblockpost/:postId", admincontroller_1.unblockPost);
exports.default = router;
