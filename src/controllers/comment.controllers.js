import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const options =  {
        page : parseInt(page) || 1,
        limit : parseInt(limit) || 10
    }

    if (!videoId || !videoId.trim()) throw new ApiError(401, "Unable to get video.");

    const pipeline = Comment.aggregate(
        [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            }
        ]
    );

    const paginatedComments = await Comment.aggregatePaginate(pipeline,options);

    if(!paginatedComments) throw new ApiError(401,"Unable to get comments.");

    return res.status(200).json(new ApiResponse(200,paginatedComments,"Video comments fetched successfully."))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    const owner = req.userId;


    if (!videoId || !videoId.trim()) throw new ApiError(401, "Unable to get video");

    if (!content || !content.trim()) throw new ApiError(401, "Missing content of comment");

    const comment = await Comment.create(
        {
            video: videoId,
            content,
            owner
        }
    );

    if (!comment) throw new ApiError(401, "Unable to comment the video");

    return res.status(200).json(new ApiResponse(200, comment, "Comment on video successfully."));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const owner = req.userId;

    if (!commentId || !commentId.trim()) throw new ApiError(401, "Unable to get comment");

    if (!content || !content.trim()) throw new ApiError(401, "Missing content of comment");

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(401, "Unable to get the comment");

    if (comment.owner != owner) throw new ApiError(401, "Unauthorized request");

    comment.content = content;

    const updatedComment = await comment.save();

    if (!updatedComment) throw new ApiError(401, "Unable to update the comment");

    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully."));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const owner = req.userId;

    if (!commentId || !commentId.trim()) throw new ApiError(401, "Unable to get comment");

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(401, "Unable to get the comment");

    if (comment.owner != owner) throw new ApiError(401, "Unauthorized request");

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) throw new ApiError(401, "Unable to delete the comment");

    return res.status(200).json(new ApiResponse(200, deletedComment, "Comment deleted successfully."));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
