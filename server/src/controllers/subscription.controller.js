import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const channel = await User.findById(channelId).select(
    "-password -refreshToken"
  );
  if (!channel) {
    throw new apiError(404, "Channel not found");
  }
  const subscriber = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  if (!subscriber) {
    throw new apiError(404, "Subscriber not found");
  }
  const isUserSubscribed = await Subscription.findOne({ channel, subscriber });
  if (isUserSubscribed) {
    await Subscription.findByIdAndDelete(isUserSubscribed._id);
    return res.status(201).json(new apiResponse(200, "Unsubscribed!", {}));
  } else {
    const subscriber_channel = await Subscription.create({
      channel,
      subscriber,
    });
    return res
      .status(201)
      .json(new apiResponse(200, "Subscribed!", subscriber_channel));
  }
});

const subscriberList = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new apiError(404, "channel ID required");
  }
  const subscriptionList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribersInfo",
      },
    },
    {
      $project: {
        _id: 0,
        username: { $arrayElemAt: ["$subscribersInfo.username", 0] },
        avatar: { $arrayElemAt: ["$subscribersInfo.avatar", 0] },
      },
    },
  ]);
  // if (!subscriptionList.length) {
  //   throw new apiError(400, "No subscribers!");
  // }
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Subscriber List Fetched Succesfully",
        subscriptionList
      )
    );
});

const subscribedToList = asyncHandler(async (req, res) => {
  //   const userId = req.user._id;

  const channelsSubscribedList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
      },
    },
    {
      $project: {
        _id: 0,
        channel_id: { $arrayElemAt: ["$channelInfo._id", 0] }, 
        channel_username: { $arrayElemAt: ["$channelInfo.username", 0] },
        channel_avatar: { $arrayElemAt: ["$channelInfo.avatar", 0] },
      },
    },
  ]);
  // if (!channelsSubscribedList.length) {
  //   throw new apiError(404, "No channels subscribed");
  // }
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Channel list fetched succesfully",
        channelsSubscribedList
      )
    );
});
const countSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new apiError(404, "Channel ID required");
  }
  
  const subscriberCount = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });
  
  return res.status(200).json(
    new apiResponse(200, "Subscriber count fetched successfully", subscriberCount)
  );
});

const countSubscribedTo = asyncHandler(async (req, res) => {
  const subscribedCount = await Subscription.countDocuments({
    subscriber: new mongoose.Types.ObjectId(req.user._id),
  });
  
  return res.status(200).json(
    new apiResponse(200, "Subscribed count fetched successfully", subscribedCount)
  );
});

export { toggleSubscription, subscriberList, subscribedToList,countSubscribers,countSubscribedTo };
