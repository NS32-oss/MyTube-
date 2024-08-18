import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // console.log(req.params);
  const { videoId } = req.params; 
  const { page = 1, limit = 100, sort = "desc" } = req.query;
  if (!videoId) {
    throw new apiError(400, "Video ID required");
  }
  const sortOrder = sort === "asc" ? 1 : -1;
  const allComments = await Comment.find({ video: videoId })
    .populate("user", "username avatar")
    .populate("video", "title thumbnail")
    .sort({ createdAt: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);
    // console.log(allComments);
  // if (allComments.length === 0) {
  //   throw new apiError(404, "No comments found");
  // }

  return res
    .status(200)
    .json(new apiResponse(200, "Comments fetched successfully", allComments));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new apiError(400, "Comment can't be empty");
  }
  if (!videoId) {
    throw new apiError(400, "Video Id required");
  }

  const user = await User.findById(req.user._id);
  const video = await Video.findById(videoId);

  if (!user) {
    throw new apiError(404, "User not found");
  }
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  let comment = await Comment.create({
    content,
    video: video._id,
    user: user._id,
  });

  // Updated population method
  comment = await Comment.findById(comment._id).populate('user', 'username avatar').exec();

  return res
    .status(200)
    .json(new apiResponse(200, "Comment created successfully", comment));
});


const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new apiError(400, "Content can't be empty");
  }
  if (!commentId) {
    throw new apiError(400, "Comment Id can't be empty");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, user: req.user._id },
    { content },
    { new: true }
  );

  if (!updatedComment) {
    throw new apiError(404, "Comment not found or not authorized");
  }

  return res
    .status(200)
    .json(new apiResponse(200, "Comment updated successfully", updatedComment));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new apiError(400, "Comment Id can't be empty");
  }

  await Comment.findOneAndDelete({ _id: commentId, user: req.user._id });

  return res
    .status(200)
    .json(new apiResponse(200, "Comment deleted successfully", {}));
});

export { getVideoComments, addComment, updateComment, deleteComment };
