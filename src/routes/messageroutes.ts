import { Router } from "express";

import { authenticateToken } from "../middleware/jwtAuth";
import {
  addParticipant,
  chats,
  createGroupChat,
  createOrGetChat,
  getChatMessages,
  getGroupDetails,
  getMessagesByChatId,
  leaveGroup,
  makeAdmin,
  removeParticipant,
  searchChat,
  searchUsers,
  sendMessage,
} from "../controller/messagecontroller";
import { fileparser } from "../middleware/formidable";

const router = Router();

router.get("/searchChat/:searchTerm", authenticateToken, searchChat);
router.get("/:chatId/messages", authenticateToken, getChatMessages);
router.post("/sendMessage", fileparser, authenticateToken, sendMessage);
router.post("/createOrGetChat", authenticateToken, createOrGetChat);
router.get("/chat/:chatId/messages", authenticateToken, getMessagesByChatId);
router.get("/getUserChats", authenticateToken, chats);
router.post("/createGroupChat", authenticateToken, createGroupChat);
router.get("/group/:chatId/details", authenticateToken, getGroupDetails);
router.delete("/group/:chatId/leave", authenticateToken, leaveGroup);
router.put("/group/:groupId/makeAdmin", authenticateToken, makeAdmin);
router.put('/group/:groupId/removeParticipant',authenticateToken,removeParticipant);
router.put('/group/:groupId/addParticipant', authenticateToken,addParticipant);
router.get('/searchUsers/:searchTerm', authenticateToken,searchUsers);


export default router;
