const urlParams = new URLSearchParams(window.location.search);
document.addEventListener("DOMContentLoaded", async () => {
  // Function to check token and fetch user
  checkTokenAndFetchUser();

  // Get the video ID from the URL
  const videoId = urlParams.get("id");

  try {
    // Fetch video data
    const response = await fetch(
      `http://localhost:8000/api/v1/video/change/${videoId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch video data");
    }

    const data = await response.json();
    const video = data.data;

    // Get elements from the DOM
    const playerContainer = document.getElementById(
      "video-player-container-home"
    );
    const videoElement = document.getElementById("current-video-home");
    const videoTitle = document.getElementById("video-title-home");
    const videoDescription = document.getElementById("video-description-home");
    const ownerAvatar = document.getElementById("owner-avatar-home");
    const ownerUsername = document.getElementById("owner-username-home");
    const ownerSubscribers = document.getElementById("owner-subscribers-home");
    const videoViews = document.getElementById("video-views-home");
    const likeButton = document.getElementById("like-btn-home");
    const subscribeButton = document.getElementById("subscribe-btn-home");
    const closePlayerButton = document.getElementById("close-player-home");

    // Set video details
    if (playerContainer) playerContainer.style.display = "block";
    if (videoElement) videoElement.src = video.videoFile;
    if (videoTitle) videoTitle.textContent = video.title;
    if (videoDescription) videoDescription.textContent = video.description;
    if (ownerAvatar)
      ownerAvatar.src = video.owner.avatar || "https://via.placeholder.com/36";
    if (ownerUsername) ownerUsername.textContent = video.owner.username;
    if (ownerSubscribers)
      ownerSubscribers.textContent = `${0} subscribers`;
    if (videoViews) videoViews.textContent = `${video.views} views`;

    // Play the video
    if (videoElement) videoElement.play();

    // Event Listener for Like Button
    // if (likeButton) {
    //     likeButton.addEventListener("click", async () => {
    //         try {
    //             const likeResponse = await fetch(`http://localhost:8000/api/v1/video/like/${videoId}`, {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                 },
    //             });

    //             if (!likeResponse.ok) {
    //                 throw new Error("Failed to like the video");
    //             }

    //             const likeData = await likeResponse.json();
    //             console.log("Video liked:", likeData);
    //             likeButton.classList.add("liked"); // Optional: Add visual feedback for the like
    //         } catch (error) {
    //             console.error("Error liking the video:", error);
    //         }
    //     });
    // }

    // // Event Listener for Subscribe Button
    // if (subscribeButton) {
    //     subscribeButton.addEventListener("click", async () => {
    //         try {
    //             const subscribeResponse = await fetch(`http://localhost:8000/api/v1/subscribe/${video.owner.id}`, {
    //                 method: "POST",
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                 },
    //             });

    //             if (!subscribeResponse.ok) {
    //                 throw new Error("Failed to subscribe to the channel");
    //             }

    //             const subscribeData = await subscribeResponse.json();
    //             console.log("Subscribed to channel:", subscribeData);
    //             subscribeButton.textContent = "Subscribed"; // Update button text to indicate subscription
    //             subscribeButton.classList.add("subscribed"); // Optional: Add visual feedback for the subscription
    //         } catch (error) {
    //             console.error("Error subscribing to the channel:", error);
    //         }
    //     });
    // }

    // Event Listener for Close Button
    if (closePlayerButton) {
      closePlayerButton.addEventListener("click", () => {
        const playerContainer = document.getElementById(
          "video-player-container-home"
        );
        if (playerContainer) playerContainer.style.display = "none";
        if (videoElement) videoElement.pause();
        history.back();
      });
    }
  } catch (error) {
    console.error("Error fetching video data:", error);
  }
});

// Function to check token and fetch user (Dummy function, replace with your actual implementation)

let userID = "";

async function checkTokenAndFetchUser() {
  try {
    const accessToken = getCookie("accessToken");

    if (!accessToken) {
      console.log("No access token found, redirecting to login page.");
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(
      "http://localhost:8000/api/v1/users/current-user",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === 200) {
        const user = data.data;
        userID = user._id;
        displayUserProfile(user);
      } else {
        console.error("Error fetching user data:", data.message);
        handleTokenError();
      }
    } else {
      if (response.status === 401) {
        console.log("Access token expired, refreshing token...");
        await refreshToken();
      } else {
        console.error("HTTP error:", response.status, response.statusText);
        handleTokenError();
      }
    }
  } catch (error) {
    console.error("Error:", error);
    handleTokenError();
  }
}

function displayUserProfile(user) {
  const userProfileImg = document.querySelector(".user-profile img");
  if (user.avatar) {
    userProfileImg.src = user.avatar;
  } else {
    userProfileImg.src =
      "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png";
  }
}

function handleTokenError() {
  console.log("Handling token error, redirecting to login page.");
  window.location.href = "login.html";
}

async function refreshToken() {
  try {
    const response = await fetch(
      "http://localhost:8000/api/v1/users/refreshAccessToken",
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Token refresh response:", data);
      if (data.status === 200) {
        const { accessToken, refreshToken } = data.data;

        // Set tokens as cookies
        setCookie("accessToken", accessToken, 1);
        setCookie("refreshToken", refreshToken, 7);

        console.log("Token refreshed successfully. Retrying user data fetch.");
        await checkTokenAndFetchUser();
      } else {
        console.error("Failed to refresh token:", data.message);
        handleTokenError();
      }
    } else {
      console.error(
        "Failed to refresh token, HTTP error:",
        response.status,
        response.statusText
      );
      handleTokenError();
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    handleTokenError();
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

document.querySelector(".user-profile img").addEventListener("click", () => {
  window.location.href = "profile.html";
});

// Comments Section
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("id"); // Fetch video ID from URL
  const commentsContainer = document.querySelector(".comment-section");
  const accessToken = getCookie("accessToken");
  let currentCommentId = null; // Store the ID of the comment being edited

  // Function to calculate how many days ago a comment was made
  function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }

  // Function to render a single comment
  function renderComment(comment) {
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");
    commentDiv.setAttribute("data-id", comment._id);

    const commenterPhotoDiv = document.createElement("div");
    commenterPhotoDiv.classList.add("commenter-photo");

    const commenterImg = document.createElement("img");
    commenterImg.src = comment.user.avatar;
    commenterImg.alt = `${comment.user.username}'s avatar`;
    commenterPhotoDiv.appendChild(commenterImg);

    const commentContentDiv = document.createElement("div");
    commentContentDiv.classList.add("comment-content");

    const commenterNameDiv = document.createElement("div");
    commenterNameDiv.classList.add("commenter-name");
    commenterNameDiv.textContent = comment.user.username;

    const commentTextDiv = document.createElement("div");
    commentTextDiv.classList.add("comment-text");
    commentTextDiv.textContent = comment.content;

    const commentDateDiv = document.createElement("div");
    commentDateDiv.classList.add("comment-date");
    commentDateDiv.textContent = timeAgo(comment.createdAt);

    commentContentDiv.appendChild(commenterNameDiv);
    commentContentDiv.appendChild(commentTextDiv);
    commentContentDiv.appendChild(commentDateDiv);

    commentDiv.appendChild(commenterPhotoDiv);
    commentDiv.appendChild(commentContentDiv);

    // Add the options menu (Edit/Delete/Report)
    const optionsDiv = document.createElement("div");
    optionsDiv.classList.add("comment-options");
    const optionsButton = document.createElement("button");
    optionsButton.classList.add("options-button");
    optionsButton.innerHTML = "<span></span><span></span><span></span>";

    const optionsMenu = document.createElement("div");
    optionsMenu.classList.add("options-menu");
    if (comment.user._id === userID) {
      const editOption = document.createElement("button");
      editOption.textContent = "Edit";
      editOption.addEventListener("click", () => {
        // Enter edit mode
        currentCommentId = comment._id;
        commentTextDiv.innerHTML = `<textarea class="edit-textarea">${comment.content}</textarea>
                                          <button class="save-button">Save</button>`;
        document
          .querySelector(".save-button")
          .addEventListener("click", () => saveCommentEdit(comment._id));
      });

      const deleteOption = document.createElement("button");
      deleteOption.textContent = "Delete";
      deleteOption.addEventListener("click", async () => {
        try {
          const response = await fetch(
            `http://localhost:8000/api/v1/comment/${comment._id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to delete comment");
          }

          commentDiv.remove(); // Remove the comment from the DOM
        } catch (error) {
          console.error("Error deleting comment:", error);
        }
      });

      optionsMenu.appendChild(editOption);
      optionsMenu.appendChild(deleteOption);
    } else {
      const reportOption = document.createElement("button");
      reportOption.textContent = "Report";
      reportOption.addEventListener("click", () => {
        alert("Report functionality to be implemented");
      });

      optionsMenu.appendChild(reportOption);
    }

    optionsDiv.appendChild(optionsButton);
    optionsDiv.appendChild(optionsMenu);
    commentDiv.appendChild(optionsDiv);

    // Insert the new comment at the top of the comments container
    commentsContainer.insertBefore(commentDiv, commentsContainer.firstChild);

    // Toggle options menu visibility
    optionsButton.addEventListener("click", () => {
      // Close any other open options menus
      const allOptionsMenus = document.querySelectorAll(
        ".options-menu.visible"
      );
      allOptionsMenus.forEach((menu) => {
        if (menu !== optionsMenu) {
          menu.classList.remove("visible");
        }
      });

      // Toggle the visibility of the current options menu
      optionsMenu.classList.toggle("visible");
    });
  }

  // Function to save the edited comment
  async function saveCommentEdit(commentId) {
    const newContent = document.querySelector(
      `.comment[data-id="${commentId}"] .edit-textarea`
    ).value;

    if (!newContent) {
      alert("Comment can't be empty");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/comment/${commentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const { data: updatedComment } = await response.json();
      const commentTextDiv = document.querySelector(
        `.comment[data-id="${commentId}"] .comment-text`
      );
      commentTextDiv.textContent = updatedComment.content;
      const optionsMenu = document.querySelector(
        `.comment[data-id="${commentId}"] .options-menu`
      );
      if (optionsMenu) {
        optionsMenu.classList.remove("visible");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  }

  // Fetch initial comments when the page loads
  fetchComments();

  // Function to fetch comments from the backend
  async function fetchComments() {
    try {
      commentsContainer.innerHTML = "";

      const response = await fetch(
        `http://localhost:8000/api/v1/comment/${videoId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const { data: comments } = await response.json();
      comments.reverse().forEach((comment) => renderComment(comment)); // Display comments with newest on top
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }

  // Handle comment submission
  document
    .querySelector("#addCommentForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const content = document.querySelector("#commentContent").value;
      if (!content) {
        alert("Comment can't be empty");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/comment/${videoId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add comment");
        }

        const { data: newComment } = await response.json();
        renderComment(newComment); // Insert the new comment at the top of the comments list
        document.querySelector("#commentContent").value = ""; // Clear the input field after submission
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    });
});
