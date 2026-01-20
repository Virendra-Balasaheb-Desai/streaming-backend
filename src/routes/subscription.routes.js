import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middlewares.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controllers.js";

const router = Router()


router.route("/channel/:channelId")
    .get(getUserChannelSubscribers)
    .patch(verifyToken,toggleSubscription);

router.route("/subscribe/:subscriberId")
    .get(getSubscribedChannels);

export default router;