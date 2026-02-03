import {Schema,model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; 
import { Comment } from "./comment.models.js";
import { Playlist } from "./playlist.models.js";
import { Like } from "./like.models.js";

const videoSchema = new Schema(
    {
        videoFile:{
            type:String,
            required:[true,"Video file is required"]
        },
        videoFileId:{
            type:String,
            required:[true,"Video file id is required"]
        },
        thumbnail:{
            type:String,
            required: true
        },
        thumbnailId:{
            type:String,
            required: true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref: "User",
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            default: 0
        },
        isPublised:{
            type:Boolean,
            default: true
        },
    },
    {
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

//Clean up after deletion like ON DELETE CASCADE
videoSchema.post("findOneAndDelete", async function (doc) {
    const videoId = doc._id;
    await Comment.deleteMany({
        video: videoId
    });
    await Like.deleteMany({
        video: videoId
    });
    await Playlist.updateMany(
        {},//update all
        {
            $pull: {
                videos: videoId
            } 
        }
    );
})

export const Video = model("Video",videoSchema)