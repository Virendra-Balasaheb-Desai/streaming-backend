import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeUserPassword, getCurrentUser, updateUserAvatar, updateUserCoverImage, updateUserAccount, getUserChannelDetails, getUserWatchHistory, deleteUser } from "../controllers/users.controllers.js";
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

router.route("/get-user").get(verifyToken,getCurrentUser)

router.route("/update-details").patch(verifyToken,updateUserAccount)

router.route("/update-avatar").patch(verifyToken,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover").patch(verifyToken,upload.single("coverImage"),updateUserCoverImage)

router.route("/channel/:username").get(getUserChannelDetails)

router.route("/watch-history").get(verifyToken,getUserWatchHistory)

router.route("/delete").delete(verifyToken,deleteUser);

export default router;