import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js";

const router = Router()

router.route("/channel/videos/:userId").get(getChannelVideos)

router.route("/channel/stats/:userId").get(getChannelStats)

export default router;