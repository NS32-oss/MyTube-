import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw new apiError(500, "Error IN generating token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All Fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new apiError(409, "User Already Exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new apiError(500, "Error in uploading avatar");
  }
  const user = await User.create({
    fullName,
    email,
    username,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Error in creating user");
  }

  // return new apiResponse(200, "User registered successfully", createdUser);
  return res
    .status(201)
    .json(new apiResponse(201, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail) {
    throw new apiError(400, "Username or Email is required");
  }
  if (!password) {
    throw new apiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const isMatch = await user.isPasswordMatch(password);
  if (!isMatch) {
    throw new apiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    // domain: "localhost", // Adjust this as needed
    path: "/",
  };

  res.cookie("accessToken", accessToken, options);
  res.cookie("refreshToken", refreshToken, options);

  // console.log("Cookies Set:", {
  //   accessToken,
  //   refreshToken,

  // });

  return res.status(200).json(
    new apiResponse(200, "User logged in successfully", {
      user: loggedInUser,
      refreshToken,
      accessToken,
    })
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, "User logged out successfully", {}));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if ([currentPassword, newPassword].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All Fields is required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const isMatch = await user.isPasswordMatch(currentPassword);
  if (!isMatch) {
    throw new apiError(401, "Invalid Password");
  }

  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new apiResponse(200, "Password changed successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userID = req.user._id;
  if (!userID) {
    throw new apiError(400, "User ID is required");
  }
  const user = await User.findById(userID).select("-password -refreshToken");
  if (!user) {
    throw new apiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new apiResponse(200, "User fetched successfully", user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;
  // if ([fullName, email, username].some((field) => field?.trim() === "")) {
  //   throw new apiError(400, "All Fields is required");
  // }
  //check if the user exists with the same email or username
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new apiError(
      409,
      "User already exists with the same email or username"
    );
  }

  const objectField = {};
  if (fullName) objectField.fullName = fullName;
  if (email) objectField.email = email;
  if (username) objectField.username = username;
  const user = await User.findByIdAndUpdate(req.user._id, objectField, {
    new: true,
  }).select("-password -refreshToken");
  return res
    .status(200)
    .json(new apiResponse(200, "User updated successfully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // console.log("Avatar: ", req.file);
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new apiError(400, "Avatar not uploaded");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true }
  ).select(" -password -refreshToken");
  return res
    .status(200)
    .json(new apiResponse(200, "User avatar updated succesfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    return res
      .status(400)
      .json(new apiResponse(402, "Cover Image not there", {}));
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    return res
      .status(400)
      .json(new apiResponse(400, "Cover Image not uploaded", {}));
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new apiResponse(200, "Cover Image updated successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  console.log("Get User Channel Profile");
  const { username } = req.params;
  console.log(username);
  if (!username) {
    throw new apiError(400, "Username required");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new apiError(400, "Channel Not Found");
  }
  console.log(channel);
  return res
    .status(200)
    .json(new apiResponse(200, "User Channel Fetched succesfully", channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [ // Corrected from "pipelines" to "pipeline"
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, "Watch History fetched", user[0].watchHistory));
});

//refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    throw new apiError(401, "Refresh token is missing");
  }
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res.cookie("accessToken", accessToken, options);
  res.cookie("refreshToken", newRefreshToken, options);
  return res.status(200).json(
    new apiResponse(200, "Access token refreshed successfully", {
      user: loggedInUser,
      refreshToken: newRefreshToken,
      accessToken,
    })
  );
});

//remove cover image

const removeCoverImage = asyncHandler(async (req, res) => {
  console.log("Remove Cover Image");
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: "",
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new apiResponse(200, "Cover Image removed successfully", user));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateAccountDetails,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  refreshAccessToken,
  removeCoverImage,  
};
