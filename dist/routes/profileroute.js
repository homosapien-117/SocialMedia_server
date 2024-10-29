"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profilecontroller_1 = require("../controller/profilecontroller");
const formidable_1 = require("../middleware/formidable");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
router.post("/uploadProfilePicture", formidable_1.fileparser, profilecontroller_1.uploadProfilePicture);
router.put("/updateProfileDetails", jwtAuth_1.authenticateToken, profilecontroller_1.updateProfileDetails);
router.patch("/updatestatus", jwtAuth_1.authenticateToken, profilecontroller_1.status);
router.get("/search/:searchTerm", jwtAuth_1.authenticateToken, profilecontroller_1.search);
router.get('/users/:userId', jwtAuth_1.authenticateToken, profilecontroller_1.getUserProfile);
router.put('/follow/:id', jwtAuth_1.authenticateToken, (req, res) => {
    if (req.io) {
        (0, profilecontroller_1.followUser)(req.io)(req, res);
    }
    else {
        res.status(500).json({ message: "Socket.IO instance is not available" });
    }
});
router.put("/cancelRequest/:userId", jwtAuth_1.authenticateToken, profilecontroller_1.cancelRequest);
router.put('/unfollow/:id', jwtAuth_1.authenticateToken, profilecontroller_1.unfollowUser);
router.get("/getFollowing/:id", profilecontroller_1.getFollowing);
router.get("/getFollowers/:id", profilecontroller_1.getFollowers);
router.put("/blockuser/:userId", jwtAuth_1.authenticateToken, profilecontroller_1.blockUser);
router.put("/unblockuser/:userId", jwtAuth_1.authenticateToken, profilecontroller_1.unblockUser);
exports.default = router;
