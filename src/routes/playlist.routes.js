import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    getUserPlaylistList,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/create").post(verifyToken, createPlaylist);

router.route("/user/:userId").get(getUserPlaylists);
router.route("/user").get(verifyToken, getUserPlaylistList);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(verifyToken, updatePlaylist)
    .delete(verifyToken, deletePlaylist);

router
    .route("/:playlistId/videos/:videoId")
    .post(verifyToken, addVideoToPlaylist)
    .delete(verifyToken, removeVideoFromPlaylist);

export default router;
