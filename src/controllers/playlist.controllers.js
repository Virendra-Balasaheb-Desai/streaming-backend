import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const owner = req.userId;
    //TODO: create playlist
    if (!(name || description)) throw new ApiError(401, "Playlist name or description is missing.");

    if (!(name.trim() || description.trim())) throw new ApiError(401, "Playlist name or description is empty.");

    const existsPlaylist = await Playlist.findOne({ name });

    if (existsPlaylist) throw new ApiError(401, "Playlist name is already exists.");

    const playlist = await Playlist.create({
        name,
        description,
        owner
    })

    if (!playlist) throw new ApiError(401, "Unable to create playlist.");

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successful."));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!userId) throw new ApiError(401, "Unable to get playlists.");

    const playlists = await Playlist.find({ owner: userId })

    if (!playlists) throw new ApiError(401, "Failed to get playlists.");

    return res.status(200).json(new ApiResponse(200, playlists, "Find playlists successful."));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!playlistId) throw new ApiError(401, "Unable to get playlist.");

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) throw new ApiError(401, "Failed to get playlist.");

    return res.status(200).json(new ApiResponse(200, playlist, "Find playlist successful."));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.userId;

    if (!playlistId) throw new ApiError(401, "Unable to get playlist.");

    if (!videoId) throw new ApiError(401, "Unable to get video.");

    const validVideo = await Video.findById(videoId);

    if (!validVideo) throw new ApiError(401, "Invalid video to add a playlist.");

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) throw new ApiError(401, "Playlist doesn't exists.");

    if(playlist.owner != userId) throw new ApiError(402, "Unauthorized request.");

    playlist.videos.addToSet(videoId);

    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) throw new ApiError(401, "Failed to get playlist.");

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully."));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.userId;
    // TODO: remove video from playlist

    if (!playlistId) throw new ApiError(401, "Unable to get playlist.");

    if (!videoId) throw new ApiError(401, "Unable to get video.");

    const validVideo = await Video.findById(videoId);

    if (!validVideo) throw new ApiError(401, "Invalid video to remove from playlist.");

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) throw new ApiError(401, "Playlist doesn't exists.");

    if(playlist.owner != userId) throw new ApiError(402, "Unauthorized request.");

    playlist.videos.pull(videoId);
 
    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) throw new ApiError(401, "Failed to get playlist.");

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully."));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const userId = req.userId;
    // TODO: delete playlist
    if (!playlistId) throw new ApiError(401, "Unable to get playlist.");

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) throw new ApiError(401, "Playlist doesn't exists.");

    if(playlist.owner != userId) throw new ApiError(402, "Unauthorized request.");

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) throw new ApiError(401, "Failed to get playlist.");

    return res.status(200).json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully."));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    const userId = req.userId;
    //TODO: update playlist
    if (!(name || description)) throw new ApiError(401, "Playlist name or description is missing.");

    if (!(name.trim() || description.trim())) throw new ApiError(401, "Playlist name or description is empty.");

    if (!playlistId) throw new ApiError(401, "Unable to get playlist.");

    const existsPlaylist = await Playlist.findOne({ name });

    if (existsPlaylist) throw new ApiError(401, "Playlist name is already exists.");

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) throw new ApiError(401, "Playlist doesn't exists.");

    if(playlist.owner != userId) throw new ApiError(402, "Unauthorized request.");

    playlist.name = name;
    playlist.description = description;

    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) throw new ApiError(401, "Failed to get playlist.");

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully."));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
