import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// Hardcoded allowed origins
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://example.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allows cookies to be sent and received
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes import and declaration
import userRouter from "./routes/user.router.js";
import subscriptionRouter from "./routes/subscription.router.js";
import videoRouter from "./routes/video.router.js";
import commentRouter from "./routes/comment.router.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comment", commentRouter);

export default app;
