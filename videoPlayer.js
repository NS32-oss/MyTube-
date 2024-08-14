document.addEventListener("DOMContentLoaded", async () => {
  checkTokenAndFetchUser();

  // Get the video ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("id");
  console.log("Video ID:", videoId);

  try {
      const response = await fetch(`http://localhost:8000/api/v1/video/change/${videoId}`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
          },
      });

      if (!response.ok) {
          throw new Error("Failed to fetch video data");
      }

      const data = await response.json();
      const video = data.data;

      // Determine the section (home or your-videos)
      const section = urlParams.get("section") || "home";

      const playerContainer = document.getElementById(
          section === "home" ? "video-player-container-home" : "video-player-container-your-videos"
      );
      const videoElement = document.getElementById(
          section === "home" ? "current-video-home" : "current-video-your-videos"
      );
      const videoTitle = document.getElementById(
          section === "home" ? "video-title-home" : "video-title-your-videos"
      );
      const videoDescription = document.getElementById(
          section === "home" ? "video-description-home" : "video-description-your-videos"
      );
      const ownerAvatar = document.getElementById(
          section === "home" ? "owner-avatar-home" : "owner-avatar-your-videos"
      );
      const ownerUsername = document.getElementById(
          section === "home" ? "owner-username-home" : "owner-username-your-videos"
      );
      const ownerSubscribers = document.getElementById(
          section === "home" ? "owner-subscribers-home" : "owner-subscribers-your-videos"
      );

      // Set video details
      if (videoElement) videoElement.src = video.videoFile;
      if (videoTitle) videoTitle.textContent = video.title;
      if (videoDescription) videoDescription.textContent = video.description;
      if (ownerAvatar) ownerAvatar.src = video.owner.avatar || "https://via.placeholder.com/36";
      if (ownerUsername) ownerUsername.textContent = video.owner.username;
      if (ownerSubscribers) ownerSubscribers.textContent = `${video.owner.subscribers} subscribers`;
      if (playerContainer) playerContainer.style.display = "block";
      if (videoElement) videoElement.play();

  } catch (error) {
      console.error("Error fetching video data:", error);
  }
});

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
              setCookie("accessToken", accessToken, 1);
              setCookie("refreshToken", refreshToken, 7);

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
