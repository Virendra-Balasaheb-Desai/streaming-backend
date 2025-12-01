import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/users.controllers.js";
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

export { router }