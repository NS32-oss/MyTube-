import mongoose, { get, isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { response } from "express";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new apiError(404, "All fields are required");
  }
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const videoLocalPath = req.files?.videoFile[0]?.path;

  if (!thumbnailLocalPath) {
    throw new apiError(404, "thumbnail required!");
  }
  if (!videoLocalPath) {
    throw new apiError(404, "video file required!");
  }
  // const videoFile = "";
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  if (!videoFile || !thumbnail) {
    throw new apiError(404, "Error while uploading on cloudinary!");
  }
  const duration = videoFile.duration;
  if (!duration) {
    throw new apiError(404, "error in fetching duration");
  }
  const owner = await User.findById(req.user._id).select(
    "-refreshToken -password"
  );

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url,
    duration,
    owner,
  });

  if (!video) {
    throw new apiError(404, "video upload failed try again please");
  }
  return res
    .status(200)
    .json(new apiResponse(200, "Video uploaded succesfully", video));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    query,
    sortBy,
    sortType = "desc",
    userId,
  } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const filter = { isPublished: true };
  if (query) {
    filter.$text = { $search: query };
  }
  if (userId) {
    filter.owner = userId;
  }

  let sortCriteria = {};
  if (sortBy) {
    sortCriteria[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sortCriteria = { createdAt: -1 };
  }

  const totalItems = await Video.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limitNumber);

  const allVideos = await Video.find(filter)
    .sort(sortCriteria)
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .populate("owner", "username avatar");
  // if (!allVideos.length) {
  //   throw new apiError(404, "No videos found");
  // }
  return res.status(200).json(
    new apiResponse(200, "All videos fetched succesfully", {
      allVideos,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems,
      },
    })
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new apiError(400, "Video ID required");
  }

  const getVideo = await Video.findOne({ _id: videoId, isPublished: true }).populate(
    "owner",
    "username avatar"
  );

  if (!getVideo) {
    throw new apiError(404, "Video not found");
  }

  // Add video ID to watch history of user and keep only unique values
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  // console.log("watch history 1", user.watchHistory);
  // Filter out the existing videoId from watchHistory
  user.watchHistory = user.watchHistory.filter((video) => !video.equals(videoId));
  
  // Add the new videoId to the front of the watch history
  user.watchHistory.unshift(videoId); // Directly push the ObjectId
  // console.log("watch history 2", user.watchHistory);
  await user.save();

  // Increment view count 
  getVideo.views += 1;
  await getVideo.save();

  return res
    .status(200)
    .json(new apiResponse(200, "Video fetched successfully", getVideo));
});


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  const updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (thumbnail) updates.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId, owner: req.user._id, isPublished: true },
    { $set: updates },
    { new: true }
  ).populate("owner", "username avatar");

  if (!updatedVideo) {
    throw new apiError(
      404,
      "Video not found or you do not have permission to update it"
    );
  }

  return res
    .status(200)
    .json(new apiResponse(200, "Video updated successfully", updatedVideo));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Video ID required");
  }
  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, "Video deleted successfully", {}));
});

//delete all videos from the database\
const deleteAllVideos = asyncHandler(async (req, res) => {
  //fetch current user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const username = user.username;
  if (username !== "ns32(admin)") {
    throw new apiError(404, "You are not authorized to delete all videos");
  }

  const video = await Video.deleteMany();

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, "All Videos deleted successfully", {}));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Video ID required");
  }

  const toggledVideo = await Video.findOneAndUpdate(
    { _id: videoId },
    [{ $set: { isPublished: { $not: "$isPublished" } } }],
    { new: true }
  ).populate("owner", "username avatar");

  if (!toggledVideo) throw new apiError(404, "Video not found"); // Changed status to 404

  const message = toggledVideo.isPublished
    ? "Video set to public successfully"
    : "Video set to private successfully";

  return res.status(200).json(new apiResponse(200, message, toggledVideo));
});
// get all videos of a user
const getVideosByUserId = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Ensure this is correctly set by authentication middleware
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const videos = await Video.find({ owner: userId }).populate(
    "owner",
    "username avatar"
  );

  return res
    .status(200)
    .json(new apiResponse(200, "Videos fetched successfully", videos));
});

// count no. of views for all videos for a user
const countViews = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Ensure this is correctly set by authentication middleware
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const videos = await Video.find({ owner: userId }).populate(
    "owner",
    "username avatar"
  );

  const totalViews = videos.reduce((acc, video) => acc + video.views, 0);

  return res
    .status(200)
    .json(new apiResponse(200, "Total views fetched successfully", totalViews));
});

export {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideosByUserId,
  countViews,
  deleteAllVideos,
};
