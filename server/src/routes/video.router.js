import { Router } from "express";
import {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideosByUserId,
  countViews,
  deleteAllVideos,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideo
);

router
  .route("/change/:videoId")
  .get(verifyJWT,getVideoById) // This expects a videoId as a parameter
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo)
  .delete(verifyJWT, deleteVideo);

router.route("/user/videos").get(verifyJWT, getVideosByUserId); // Route for user videos

router
  .route("/togglePublishStatus/:videoId")
  .patch(verifyJWT, togglePublishStatus);

router.route("/views").get(verifyJWT, countViews);

router.route("/deleteAllVideos").delete(verifyJWT, deleteAllVideos);

export default router;
