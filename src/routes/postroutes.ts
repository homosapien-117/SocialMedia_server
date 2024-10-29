import { Router } from "express";
import {
  createPost,
  getUserPosts,
  editPost,
  deletePost,
  createReport,
  likePost,
  addComment,
  deleteImage,
  getAllPosts,
} from "../controller/postController";
import { fileparser } from "../middleware/formidable";
import { getTimelinePost } from "../controller/authController";
import { authenticateToken } from "../middleware/jwtAuth";

const router = Router();

router.post("/createPost", fileparser, createPost);

router.get("/posts/:userId", authenticateToken, getUserPosts);

router.get("/posts", getAllPosts);


router.put("/editpost/:postId", fileparser, editPost);

router.delete("/deletepost/:postId", authenticateToken, deletePost);

router.get("/getTimelinePost/:userId", authenticateToken, getTimelinePost);

router.post("/reportpost/:postId", authenticateToken, createReport);

router.post("/likepost/:postId", authenticateToken, (req, res) => {
  if (req.io) {
    likePost(req.io)(req, res);
  } else {
    res.status(500).json({ message: "Socket.IO instance is not available" });
  }
});

router.post("/commentpost/:postId", authenticateToken, addComment);

router.post("/deleteimage/:postId", authenticateToken, deleteImage);

export default router;
