import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/create").post(verifyToken, createPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(verifyToken, updatePlaylist)
    .delete(verifyToken, deletePlaylist);

router
    .route("/:playlistId/videos/:videoId")
    .patch(verifyToken, addVideoToPlaylist)
    .delete(verifyToken, removeVideoFromPlaylist);

export default router;
