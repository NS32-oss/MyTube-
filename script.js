document.addEventListener("DOMContentLoaded", async () => {
  await loadVideos();
  showSection('home');
  checkTokenAndFetchUser();

  document.getElementById("close-player").addEventListener("click", () => {
    document.getElementById("video-player-container").style.display = "none";
    document.getElementById("current-video").pause();
  });
});

async function loadVideos() {
  try {
    const response = await fetch("http://localhost:8000/api/v1/video/"); // Adjust your API endpoint
    const result = await response.json();

    if (result.status === 200) {
      // console.log("Videos:", result.data);
      renderVideos(result.data.allVideos);
    } else {
      console.error("Error fetching videos:", result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function renderVideos(videos) {
  // console.log("Rendering videos:", videos);
  const videoGrid = document.getElementById("video-grid");
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
    const daysAgo = Math.floor((currentDate - uploadDate) / (1000 * 60 * 60 * 24));
    //show video duration upto 2 points only
    const videoDuration = video.duration
    // make this videoDuration  to only 2 decimals after "."
    const videoDuration2 = videoDuration.toFixed(2);
    console.log("Videos found:", videos.length);
        videoCard.innerHTML = `
      <div class="video-thumbnail">
        <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${video.title}">
        <span class="video-duration">${videoDuration2}</span>
      </div>
      <div class="video-info">
        <div class="channel-icon-container"> 
          <img class="channel-icon" src="${video.owner.avatar || 'https://via.placeholder.com/36'}" alt="${video.channelName}">
        </div>
        <div class="video-details">
          <h3 class="video-title">${video.title}</h3>
          <p class="video-channel">${video.owner.username}</p>
          <p class="video-stats">${video.views} views • ${daysAgo} days ago</p>
        </div>
      </div>
    `;

    videoCard.addEventListener("click", () => {
      playVideo(video);
    });

    videoGrid.appendChild(videoCard);
  });
}
function playVideo(video) {
  const videoPlayerContainer = document.getElementById("video-player-container");
  const currentVideo = document.getElementById("current-video");
  const videoTitle = document.getElementById("video-title");
  const videoDescription = document.getElementById("video-description");

  currentVideo.src = video.videoFile;
  videoTitle.textContent = video.title;
  videoDescription.textContent = video.description || "No description available";

  videoPlayerContainer.style.display = "block";
  currentVideo.play();
}

//fetch all videos for a particular user and show this "your videos" section
// when the user clicks on the "Your Videos" link in the navigation bar. then call the loadYourVideos function
document.getElementById("your-videos-link").addEventListener("click", async () => {
  showSection('your-videos');
  await loadYourVideos();
});
async function loadYourVideos() {
  try {
    const accessToken = getCookie("accessToken");
    const response = await fetch("http://localhost:8000/api/v1/video/getVideosByUserId", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });
    const result = await response.json();
    console.log("Your videos response:", result);
    if (result.status === 200) {
      renderVideos(result.data);
    } else {
      console.error("Error fetching videos:", result.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
      section.style.display = section.id === sectionId ? 'block' : 'none';
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

    const response = await fetch("http://localhost:8000/api/v1/users/current-user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

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
    userProfileImg.src = "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png";
  }
}

function handleTokenError() {
  console.log("Handling token error, redirecting to login page.");
  window.location.href = "login.html";
}

async function refreshToken() {
  try {
    const response = await fetch("http://localhost:8000/api/v1/users/refreshAccessToken", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Token refresh response:", data);
      if (data.status === 200) {
        const { accessToken, refreshToken } = data.data;

        // Set tokens as cookies
        setCookie('accessToken', accessToken, 1);  // No secure attribute for local testing
        setCookie('refreshToken', refreshToken, 7); // Assuming refresh token is valid for 7 days

        console.log("Token refreshed successfully. Retrying user data fetch.");
        await checkTokenAndFetchUser();
      } else {
        console.error("Failed to refresh token:", data.message);
        handleTokenError();
      }
    } else {
      console.error("Failed to refresh token, HTTP error:", response.status, response.statusText);
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
