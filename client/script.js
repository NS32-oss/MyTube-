let currentUserId = null;
let currentUser = null;
document.addEventListener("DOMContentLoaded", async () => {
  await initializePage();
  setupEventListeners();
});

async function initializePage() {
  await checkTokenAndFetchUser();
  await loadVideos("home");
  showSection("home");
  await loadYourVideos();
}

function setupEventListeners() {
  setupClosePlayerListener("home");
  setupClosePlayerListener("your-videos");

  const yourVideosButton = document.getElementById("your-videos");
  if (yourVideosButton) {
    yourVideosButton.addEventListener("click", () =>
      showSection("your-videos")
    );
  }

  setupLikeButton("home");
  setupSubscribeButton("home");
  setupUserProfileRedirect();
  // setupCoverImageOptions();
  setupDropdownMenus();
}

function setupClosePlayerListener(section) {
  const closePlayer = document.getElementById(`close-player-${section}`);
  if (closePlayer) {
    closePlayer.addEventListener("click", () => {
      const playerContainer = document.getElementById(
        `video-player-container-${section}`
      );
      const currentVideo = document.getElementById(`current-video-${section}`);
      if (playerContainer) playerContainer.style.display = "none";
      if (currentVideo) currentVideo.pause();
    });
  }
}

async function loadVideos(section) {
  try {
    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/video/`
    );
    const result = await response.json();

    if (result.status === 200) {
      renderVideos(result.data.allVideos, section);
    } else {
      console.error("Error fetching videos:", result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadYourVideos() {
  try {
    const accessToken = getCookie("accessToken");
    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/video/user/videos`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );
    const result = await response.json();
    if (result.status === 200) {
      //calculate total views of all videos
      let totalViews = 0;
      result.data.forEach((video) => (totalViews += video.views));
      const totalViewsElement = document.getElementById("total-views");
      if (totalViewsElement) totalViewsElement.textContent = totalViews;
      const totalVideosElement = document.getElementById("total-videos");
      if (totalVideosElement)
        totalVideosElement.textContent = result.data.length;
      renderVideos(result.data, null);
    } else {
      console.error("Error fetching videos:", result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const interval = Math.floor(seconds / 31536000);

  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return `1 year ago`;

  const months = Math.floor(seconds / 2592000);
  if (months > 1) return `${months} months ago`;
  if (months === 1) return `1 month ago`;

  const weeks = Math.floor(seconds / 604800);
  if (weeks > 1) return `${weeks} weeks ago`;
  if (weeks === 1) return `1 week ago`;

  const days = Math.floor(seconds / 86400);
  if (days > 1) return `${days} days ago`;
  if (days === 1) return `1 day ago`;

  const hours = Math.floor(seconds / 3600);
  if (hours > 1) return `${hours} hours ago`;
  if (hours === 1) return `1 hour ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes > 1) return `${minutes} minutes ago`;
  if (minutes === 1) return `1 minute ago`;

  return `Just now`;
}

function renderVideos(videos, section) {
  // Sort videos by createdAt in descending order (newest first)
  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const videoGrid = document.getElementById(
    section === "home" ? "video-grid-home" : "video-grid-your-videos"
  );
  if (!videoGrid) return;

  videoGrid.innerHTML = videos.length === 0 ? "<p>No videos found</p>" : "";

  videos.forEach((video) => {
    const videoCard = document.createElement("div");
    videoCard.className = "video-card";

    const uploadDate = new Date(video.createdAt);
    const timeAgoText = timeAgo(uploadDate);
    const videoDuration = video.duration.toFixed(2);
    const videoId = video._id;

    videoCard.innerHTML = `
      <div class="video-thumbnail">
        <img src="${
          video.thumbnail || "https://via.placeholder.com/320x180"
        }" alt="${video.title}">
        <span class="video-duration">${videoDuration}</span>
      </div>
      <div class="video-info">
        <div class="channel-icon-container">
          <img class="channel-icon" src="${
            video.owner.avatar || "https://via.placeholder.com/36"
          }" alt="${video.channelName}">
        </div>
        <div class="video-details">
          <h3 class="video-title">${video.title}</h3>
          <p class="video-channel">${video.owner.username}</p>
          <p class="video-stats">${video.views} views • ${timeAgoText}</p>
        </div>
        <div class="three-dots-menu">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <div class="dropdown-menu">
            <ul>
              ${
                video.owner._id === currentUserId ||
                currentUser === 'ns32(admin)'
                  ? '<li><a href="#" class="delete-option">Delete</a></li>'
                  : ""
              }
              <li><a href="#" class="report-option">Report</a></li>
            </ul>
          </div>
        </div>
      </div>
    `;
    console.log(currentUser);
    // change the css of dropdown menu if the user is the owner of the video
    if(video.owner._id !== currentUserId &&
      currentUser !== 'ns32(admin)')
      {
        //set .dropdown-menu height to 30px
        videoCard.querySelector(".dropdown-menu").style.height = "30px";
        // top tp -30px
        videoCard.querySelector(".dropdown-menu").style.top = "-50px";
      }
    // Event listener for video card clicks
    videoCard.addEventListener("click", (event) => {
      // Redirect to video player page if not clicking on the three-dots menu
      if (!event.target.closest(".three-dots-menu")) {
        window.location.href = `videoPlayer.html?id=${videoId}`;
      }
    });

    // Event listener for delete option
    const deleteOption = videoCard.querySelector(".delete-option");
    if (deleteOption) {
      deleteOption.addEventListener("click", async (event) => {
        event.stopPropagation();
        // delete video logic
        const accessToken = getCookie("accessToken");
        try {
          const response = await fetch(
            `https://mytubeapp.onrender.com/api/v1/video/change/${videoId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              credentials: "include",
            }
          );

          const result = await response.json();

          if (result.status === 200) {
            videoCard.remove();
            alert("Video deleted successfully");
          } else {
            console.error("Error deleting video:", result.message);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      });
    }

    // Event listener for report option
    const reportOption = videoCard.querySelector(".report-option");
    reportOption.addEventListener("click", (event) => {
      event.stopPropagation();
      // Add your report video logic here
      console.log(`Report video with id: ${videoId}`);
    });

    setupDropdownMenus();
    videoGrid.appendChild(videoCard);
  });
}

function setupLikeButton(section) {
  const likeButton = document.getElementById(`like-btn-${section}`);
  if (likeButton) {
    likeButton.addEventListener("click", function () {
      this.classList.toggle("liked");
    });
  }
}

function setupSubscribeButton(section) {
  const subscribeButton = document.getElementById(`subscribe-btn-${section}`);
  if (subscribeButton) {
    subscribeButton.addEventListener("click", function () {
      this.classList.toggle("subscribed");
    });
  }
}

function showSection(sectionId) {
  document
    .querySelectorAll(".section")
    .forEach((section) => (section.style.display = "none"));
  document.getElementById(sectionId).style.display = "block";

  document
    .querySelectorAll("nav ul li a")
    .forEach((link) => link.classList.remove("active"));
  document.getElementById(`${sectionId}-link`).classList.add("active");
}

async function checkTokenAndFetchUser() {
  try {
    const accessToken = getCookie("accessToken");

    if (!accessToken) {
      redirectToLogin();
      return;
    }

    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/users/current-user`,
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
        currentUserId = data.data._id;
        currentUser = data.data.username;
        displayUserProfile(data.data);
      } else {
        console.error("Error fetching user data:", data.message);
        handleTokenError();
      }
    } else if (response.status === 401) {
      await refreshToken();
    } else {
      console.error("HTTP error:", response.status, response.statusText);
      handleTokenError();
    }
  } catch (error) {
    console.error("Error:", error);
    handleTokenError();
  }
}

function displayUserProfile(user) {
  const userProfileImg = document.querySelector(".user-profile img");
  userProfileImg.src =
    user.avatar ||
    "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png";
}

function handleTokenError() {
  redirectToLogin();
}

async function refreshToken() {
  try {
    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/users/refreshAccessToken`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === 200) {
        setCookie("accessToken", data.data.accessToken, 1);
        setCookie("refreshToken", data.data.refreshToken, 7);
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
  return parts.length === 2 ? parts.pop().split(";").shift() : null;
}

function redirectToLogin() {
  console.log("No access token found, redirecting to login page.");
  window.location.href = "login.html";
}

function setupUserProfileRedirect() {
  document
    .querySelector(".user-profile img")
    .addEventListener("click", () => (window.location.href = "profile.html"));
}

// function setupCoverImageOptions() {
//   let isOptionsVisible = false;

//   document.getElementById("cover-image-options-button").addEventListener("click", () => {
//     isOptionsVisible = !isOptionsVisible;
//     document.querySelector(".cover-image-options").style.display = isOptionsVisible ? "block" : "none";
//   });

//   document.getElementById("cover-image-input").addEventListener("change", updateCoverImage);
//   document.getElementById("profile-image-input").addEventListener("change", updateProfileImage);
//   document.getElementById("remove-cover-image").addEventListener("click", removeCoverImage);
// }

function updateCoverImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) =>
      (document.getElementById("cover-image").src = e.target.result);
    reader.readAsDataURL(file);
  }
}

function updateProfileImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) =>
      (document.getElementById("profile-image").src = e.target.result);
    reader.readAsDataURL(file);
  }
}

function removeCoverImage() {
  document.getElementById("cover-image").src =
    "https://example.com/default-cover-image.png";
}

function setupDropdownMenus(string) {
  
  let currentlyOpenDropdown = null;

  document.addEventListener("click", (event) => {
    // Close all dropdown menus if clicked outside
    const dropdowns = document.querySelectorAll(".dropdown-menu");
    dropdowns.forEach((dropdown) => {
      if (
        !dropdown.contains(event.target) &&
        !event.target.closest(".three-dots-menu")
      ) {
        dropdown.classList.remove("show");
        if (currentlyOpenDropdown === dropdown) {
          currentlyOpenDropdown = null;
        }
      }
    });

    // Toggle dropdown menu visibility
    const menu = event.target.closest(".three-dots-menu");
    if (menu) {
      const dropdown = menu.querySelector(".dropdown-menu");
      if (dropdown) {
        // Close any previously open dropdown
        if (currentlyOpenDropdown && currentlyOpenDropdown !== dropdown) {
          currentlyOpenDropdown.classList.remove("show");
        }
        if(string)
          {
            console.log(string);
          }
        dropdown.classList.toggle("show");
        currentlyOpenDropdown = dropdown;

        event.stopPropagation(); // Prevent click from propagating to document
        event.preventDefault(); // Prevent default action if necessary
      }
    }
  });
}

// Call the function to set up the dropdown menus
setupDropdownMenus("k");

document
  .getElementById("video-dropdown-button")
  .addEventListener("click", function (event) {
    const dropdownMenu = document.getElementById("video-dropdown-menu");
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
    event.stopPropagation();
  });

document.addEventListener("click", function () {
  const dropdownMenu = document.getElementById("video-dropdown-menu");
  if (dropdownMenu.style.display === "block") {
    dropdownMenu.style.display = "none";
  }
});
