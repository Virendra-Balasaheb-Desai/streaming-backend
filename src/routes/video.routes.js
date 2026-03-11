import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideoDetails,
    updateVideoThumbnail,
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyToken);

router
    .route("/")
    .get(getAllVideos)
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
    .get(getVideoById)
    .patch(updateVideoDetails)
    .delete(deleteVideo);

router
    .route("/:videoId/thumbnail")
    .patch(upload.single("thumbnail"), updateVideoThumbnail);

router.route("/:videoId/publish-status").patch(togglePublishStatus);

export default router;
