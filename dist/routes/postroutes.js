"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = require("../controller/postController");
const formidable_1 = require("../middleware/formidable");
const authController_1 = require("../controller/authController");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
router.post("/createPost", formidable_1.fileparser, postController_1.createPost);
router.get("/posts/:userId", jwtAuth_1.authenticateToken, postController_1.getUserPosts);
router.get("/posts", postController_1.getAllPosts);
router.put("/editpost/:postId", formidable_1.fileparser, postController_1.editPost);
router.delete("/deletepost/:postId", jwtAuth_1.authenticateToken, postController_1.deletePost);
router.get("/getTimelinePost/:userId", jwtAuth_1.authenticateToken, authController_1.getTimelinePost);
router.post("/reportpost/:postId", jwtAuth_1.authenticateToken, postController_1.createReport);
router.post("/likepost/:postId", jwtAuth_1.authenticateToken, (req, res) => {
    if (req.io) {
        (0, postController_1.likePost)(req.io)(req, res);
    }
    else {
        res.status(500).json({ message: "Socket.IO instance is not available" });
    }
});
router.post("/commentpost/:postId", jwtAuth_1.authenticateToken, postController_1.addComment);
router.post("/deleteimage/:postId", jwtAuth_1.authenticateToken, postController_1.deleteImage);
exports.default = router;
