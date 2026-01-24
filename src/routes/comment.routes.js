import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controllers.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/video/:videoId")
    .get(getVideoComments)
    .post(verifyToken,addComment);

router.use(verifyToken).route("/comment/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;