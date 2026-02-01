import mongoose from "mongoose";
import { Like } from "./like.models.js";

export const tweetSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

//Clean up after deletion like ON DELETE CASCADE
tweetSchema.post("findOneAndDelete", async function (doc) {
    const tweetId = doc._id;
    
    await Like.deleteMany({
            tweet: tweetId
    });
})

export const Tweet = mongoose.model("Tweet", tweetSchema)