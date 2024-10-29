import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { initializeSocketIO } from "./services/socketIo";
import authRouter from "./routes/authroutes";
import adminroutes from "./routes/adminroutes";
import profileroutes from "./routes/profileroute";
import postroutes from "./routes/postroutes";
import notificationroutes from "./routes/notificationroutes";
import messageroutes from "./routes/messageroutes";
import "./types/express";


dotenv.config();

console.log("DB_URL:", process.env.DB_URL);
console.log("PORT:", process.env.PORT);

const app = express();
const server = createServer(app);

const io=initializeSocketIO(server)

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
  })
);

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/auth", adminroutes);
app.use("/api/auth", (req,res,next)=>{
  req.io=io;
  next()
},profileroutes);
app.use("/api/auth",(req,res,next)=>{
  req.io=io;
  next()
},postroutes)
app.use("/api/auth",notificationroutes)
app.use("/api/auth",messageroutes)


const DB_URL = process.env.DB_URL as string;
mongoose
  .connect(DB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Failed to connect to MongoDB", error));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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

export default app;
