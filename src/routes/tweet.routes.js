import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controllers.js";
import { verifyToken } from "../middlewares/auth.middlewares.js"
const router = Router();

router.route("/")
    .post(verifyToken, createTweet);

router.route("/:tweetId")
    .patch(verifyToken, updateTweet)
    .delete(verifyToken, deleteTweet);

router.route("/user/:userId")
    .get(getUserTweets);


export default router;