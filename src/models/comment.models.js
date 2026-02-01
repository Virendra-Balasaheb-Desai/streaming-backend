import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Like } from "./like.models.js";
import { tweetSchema } from "./tweet.models.js";

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
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

commentSchema.plugin(mongooseAggregatePaginate)

//Clean up after deletion like ON DELETE CASCADE
commentSchema.post("findOneAndDelete", async function (doc) {
    const commentId = doc._id;
    
    await Like.deleteMany({
            comment: commentId
    });
})

export const Comment = mongoose.model("Comment", commentSchema)