import { Router } from "express";
import {
  uploadProfilePicture,
  updateProfileDetails,
  status,
  search,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  blockUser,
  unblockUser,
  cancelRequest,

} from "../controller/profilecontroller";
import { fileparser } from "../middleware/formidable";
import { authenticateToken } from "../middleware/jwtAuth";

const router = Router();

router.post("/uploadProfilePicture", fileparser, uploadProfilePicture);
router.put("/updateProfileDetails",authenticateToken, updateProfileDetails);
router.patch("/updatestatus",authenticateToken,status);
router.get("/search/:searchTerm",authenticateToken, search);
router.get('/users/:userId',authenticateToken, getUserProfile);
router.put('/follow/:id',authenticateToken,(req, res) => {
  if (req.io) {
    followUser(req.io)(req, res);
  } else {
    res.status(500).json({ message: "Socket.IO instance is not available" });
  }
})
router.put("/cancelRequest/:userId",authenticateToken,cancelRequest)
router.put('/unfollow/:id',authenticateToken,unfollowUser)
router.get("/getFollowing/:id",getFollowing)
router.get("/getFollowers/:id",getFollowers)
router.put("/blockuser/:userId",authenticateToken, blockUser);
router.put("/unblockuser/:userId",authenticateToken, unblockUser);

export default router;
