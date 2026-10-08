import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideoDetails,
    updateVideoThumbnail,
    getVideoBySearch,
    getHomePageVideos,
    updateVideoView,
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();

//All public routes
router.route("/public").get(getHomePageVideos);
router.route("/search").get(getVideoBySearch);
router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);

router.use(verifyToken);

router
    .route("/")
    .post(
        upload.fields([
            {
                name: "video",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .patch(updateVideoDetails)
    .delete(deleteVideo);

router.route("/:videoId/protected").get(getVideoById);

router
    .route("/:videoId/thumbnail")
    .patch(upload.single("thumbnail"), updateVideoThumbnail);

router.route("/:videoId/publish-status").patch(togglePublishStatus);

router.route("/:videoId/views").patch(updateVideoView);

export default router;
