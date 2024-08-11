document.addEventListener("DOMContentLoaded", async () => {
  await loadVideos("home");
  showSection("home");
  checkTokenAndFetchUser();

  document.getElementById("close-player-home").addEventListener("click", () => {
    document.getElementById("video-player-container-home").style.display =
      "none";
    document.getElementById("current-video-home").pause();
  });

  document
    .getElementById("close-player-your-videos")
    .addEventListener("click", () => {
      document.getElementById(
        "video-player-container-your-videos"
      ).style.display = "none";
      document.getElementById("current-video-your-videos").pause();
    });

  await loadYourVideos();
  document.getElementById("your-videos").addEventListener("click", async () => {
    showSection("your-videos");
  });
});

async function loadVideos(section) {
  try {
    const response = await fetch("http://localhost:8000/api/v1/video/"); // Adjust your API endpoint
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
      "http://localhost:8000/api/v1/video/getVideosByUserId",
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
      //set no. of videos in the profile page as per size of result.data
      document.getElementById("total-videos").textContent = result.data.length;
      renderVideos(result.data, "your-videos");
    } else {
      console.error("Error fetching videos:", result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function renderVideos(videos, section) {
  const videoGrid = document.getElementById(
    section === "home" ? "video-grid-home" : "video-grid-your-videos"
  );
  videoGrid.innerHTML = ""; // Clear any existing content

  if (videos.length === 0) {
    videoGrid.innerHTML = "<p>No videos found</p>";
    console.log("No videos found");
    return;
  }

  videos.forEach((video) => {
    const videoCard = document.createElement("div");
    videoCard.className = "video-card";

    // Calculate days ago
    const uploadDate = new Date(video.createdAt);
    const currentDate = new Date();
    const daysAgo = Math.floor(
      (currentDate - uploadDate) / (1000 * 60 * 60 * 24)
    );

    // Show video duration with 2 decimal points
    const videoDuration = video.duration.toFixed(2);

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
          <p class="video-stats">${video.views} views • ${daysAgo} days ago</p>
        </div>
      </div>
    `;

    videoCard.addEventListener("click", () => {
      const playerContainer = document.getElementById(
        section === "home"
          ? "video-player-container-home"
          : "video-player-container-your-videos"
      );
      const videoElement = document.getElementById(
        section === "home" ? "current-video-home" : "current-video-your-videos"
      );
      const videoTitle = document.getElementById(
        section === "home" ? "video-title-home" : "video-title-your-videos"
      );
      const videoDescription = document.getElementById(
        section === "home"
          ? "video-description-home"
          : "video-description-your-videos"
      );
      const videoViews = document.getElementById(
        section === "home" ? "video-views-home" : "video-views-your-videos"
      );
      const ownerAvatar = document.getElementById(
        section === "home" ? "owner-avatar-home" : "owner-avatar-your-videos"
      );
      const ownerUsername = document.getElementById(
        section === "home"
          ? "owner-username-home"
          : "owner-username-your-videos"
      );
      const ownerSubscribers = document.getElementById(
        section === "home"
          ? "owner-subscribers-home"
          : "owner-subscribers-your-videos"
      );

      videoElement.src = video.videoFile;
      videoTitle.textContent = video.title;
      videoDescription.textContent = video.description;
      videoViews.textContent = `${video.views} views`;
      ownerAvatar.src = video.owner.avatar;
      ownerUsername.textContent = video.owner.username;
      ownerSubscribers.textContent = `100 subscribers`;
      playerContainer.style.display = "block";
      videoElement.play();
    });

    videoGrid.appendChild(videoCard);
  });
}
// Toggle Like Button State
document.getElementById("like-btn-home").addEventListener("click", function () {
  this.classList.toggle("liked");
  // You can also handle the logic to update the like status on the server here
});

// Toggle Subscribe Button State
document
  .getElementById("subscribe-btn-home")
  .addEventListener("click", function () {
    this.classList.toggle("subscribed");
    // You can also handle the logic to update the subscription status on the server here
  });

function showSection(section) {
  const sections = document.querySelectorAll("section.section");
  sections.forEach((sec) => {
    sec.style.display = sec.id === section ? "block" : "none";
  });
}

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
        setCookie("accessToken", accessToken, 1); // No secure attribute for local testing
        setCookie("refreshToken", refreshToken, 7); // Assuming refresh token is valid for 7 days

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

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
  });

  document.getElementById(sectionId).style.display = "block";

  document.querySelectorAll("nav ul li a").forEach((link) => {
    link.classList.remove("active");
  });

  document.getElementById(`${sectionId}-link`).classList.add("active");
}

function toggleEditProfileForm() {
  const formContainer = document.getElementById("edit-profile-form-container");
  formContainer.style.display =
    formContainer.style.display === "block" ? "none" : "block";
}

let isOptionsVisible = false;

function toggleCoverImageOptions() {
  const options = document.querySelector(".cover-image-options");
  isOptionsVisible = !isOptionsVisible;
  options.style.display = isOptionsVisible ? "block" : "none";
}

function updateCoverImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("cover-image").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function updateProfileImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("profile-image").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function removeCoverImage() {
  document.getElementById("cover-image").src =
    "path/to/default-cover-image.jpg"; // Update path accordingly
}

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
