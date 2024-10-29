import express from "express";
import {
  getAllUser,
  blockuser,
  unblockuser,
  deleteuser,
  edituser,
  getReportedPosts,
  getReportDetails,
  blockPost,
  unblockPost
} from "../controller/admincontroller";
import { authenticateToken } from "../middleware/jwtAuth";



const router = express.Router();

router.get("/userlist", authenticateToken, getAllUser);
router.put("/block/:id", blockuser);
router.put("/unblock/:id", unblockuser);
router.delete("/deleteuser/:id", deleteuser);
router.put("/edituser/:id", edituser);
router.get('/reportedposts', getReportedPosts);
router.get("/reportdetails/:postId",getReportDetails)
router.post("/blockpost/:postId", blockPost);
router.post("/unblockpost/:postId", unblockPost);

export default router;
