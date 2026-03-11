import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middlewares.js";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
} from "../controllers/like.controllers.js";

const router = Router();

router.use(verifyToken);

router.route("/").get(getLikedVideos);

router.route("/video/:videoId").patch(toggleVideoLike);

router.route("/comment/:commentId").patch(toggleCommentLike);

router.route("/tweet/:tweetId").patch(toggleTweetLike);

export default router;
