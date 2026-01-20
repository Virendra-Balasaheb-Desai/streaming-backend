import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const subscriber = req.userId;

    if (!channelId || !channelId.trim()) throw new ApiError(401, "Unable to get channel");

    const subscribed = await Subscription.findOne(
        {
            subscriber,
            channel: channelId
        }
    );

    if (!subscribed) {
        const subscribe = await Subscription.create({
            subscriber,
            channel: channelId
        });
        if (!subscribe) throw new ApiError(401, "Unable to subscribe channel");
        return res.status(200).json(new ApiResponse(200, {}, "Channel subscribed successfully."));
    }
    else {        
        const unsubscribe = await Subscription.findByIdAndDelete(subscribed._id);
        if (!unsubscribe) throw new ApiError(401, "Unable to unsubscribe channel");
        return res.status(200).json(new ApiResponse(200, {}, "Channel unsubscribed successfully."));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId || !channelId.trim()) throw new ApiError(401, "Unable to get channel");

    const subscribers = await Subscription.find(
        {
            channel: channelId
        }
    );

    if (!subscribers) throw new ApiError(401, "Unable to subscribers of channel");

    const data = {
        totalsubscribers: subscribers.length,
        subscribers
    };

    return res.status(200).json(new ApiResponse(200, data, "Channel subscribers fetched successfully."));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId || !subscriberId.trim()) throw new ApiError(401, "Unable to get subscriber");

    const subscribedChannels = await Subscription.find(
        {
            subscriber: subscriberId
        }
    );

    if (!subscribedChannels) throw new ApiError(401, "Unable to get subscribed of channels");

    const data = {
        totalSubscribedChannels: subscribedChannels.length,
        subscribedChannels
    };

    return res.status(200).json(new ApiResponse(200, data, "Subscribed channels fetched successfully."));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}