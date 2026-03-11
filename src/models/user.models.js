import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Comment } from "./comment.models.js";
import { Video } from "./video.models.js";
import { Like } from "./like.models.js";
import { Playlist } from "./playlist.models.js";
import { Subscription } from "./subscription.models.js";
import { Tweet } from "./tweet.models.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercare: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercare: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        avatarId: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
        },
        coverImageId: {
            type: String,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.isPasswordVerify = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            fullName: this.fullName,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

//Clean up after deletion like ON DELETE CASCADE
userSchema.post("findOneAndDelete", async function () {
    try {
        const userId = this.getFilter()._id;
        await Comment.deleteMany({
            owner: userId,
        });

        const userVideos = await Video.find({
            owner: userId,
        });
        // delete files from cloud as well.
        userVideos.forEach(async (video) => {
            const thumbnail = await deleteFromCloudinary(video.thumbnailId);
            if (!thumbnail)
                console.log("From user clean up, thumbail not deleted.");
            const videoFile = await deleteFromCloudinary(
                video.videoFileId,
                "video"
            );
            if (!videoFile)
                console.log("From user clean up, video file not deleted.");
        });
        // after deletion of files from cloud, delete entries from DB.
        await Video.deleteMany({
            owner: userId,
        });

        await Tweet.deleteMany({
            owner: userId,
        });
        await Playlist.deleteMany({
            owner: userId,
        });
        await Subscription.deleteMany({
            channel: userId,
        });
        await Like.deleteMany({
            likeBy: userId,
        });
    } catch (error) {
        console.log("After user deletion cleap up function error : ", error);
    }
});

export const User = model("User", userSchema);
