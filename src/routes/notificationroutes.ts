import { Router } from "express";
import { approveFollowRequest, declineFollowRequest, getNotifications } from "../controller/notificationController";
import { authenticateToken } from "../middleware/jwtAuth";

const router = Router();

router.get("/notifications", authenticateToken,getNotifications);
router.post("/approve-follow/:notificationId", authenticateToken,approveFollowRequest);
router.post("/decline-follow/:notificationId",authenticateToken,declineFollowRequest)

export default router;
