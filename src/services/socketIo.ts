import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import Message from "../models/messageModel"
import dotenv from "dotenv";

dotenv.config()

export function initializeSocketIO(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("register",(userId:string)=>{
      socket.join(userId)
      console.log("user joined the room"+userId);
      socket.emit("connected")
    })

    socket.on("liked post", (notification:{userId:string}) => {
   
      if(notification){
        socket.to(notification.userId).emit("newLike",notification)
        console.log('socket send from backend');
        
      }
    });
    socket.on("comment",(notification:{userId:string})=>{
      if(notification){
        socket.to(notification.userId).emit("newComment",notification)
      }
    })

    socket.on("sendMessage", async (message: { chatId: string, content: string, senderId: string }) => {
      console.log("Received message for saving:", message);
      try {
        socket.to(message.chatId).emit("receiveMessage", message);
        console.log("Message saved and broadcasted:", message);
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });
    
     socket.on("JoinRoom",(chatId)=>{
      socket.join(chatId)
      console.log("joined chat room");
      
     })

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}
