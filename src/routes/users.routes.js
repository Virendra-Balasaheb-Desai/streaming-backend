import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeUserPassword, getCurrentUser, updateUserAvatar, updateUserCoverImage, updateUserAccount, getUserChannelDetails, getUserWatchHistory } from "../controllers/users.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyToken } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(
    upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
    ]), registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyToken,logoutUser)

router.route("/refreshtoken").post(refreshAccessToken)

router.route("/change-password").post(verifyToken,changeUserPassword)

router.route("/get-user").post(verifyToken,getCurrentUser)

router.route("/update-details").post(verifyToken,updateUserAccount)

router.route("/update-avatar").post(verifyToken,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover").post(verifyToken,upload.single("coverImage"),updateUserCoverImage)

router.route("/channel/:username").post(getUserChannelDetails)

router.route("/watch-history").post(verifyToken,getUserWatchHistory)

export default router;