document.addEventListener("DOMContentLoaded", () => {
  checkTokenAndFetchUser();
});

async function checkTokenAndFetchUser() {
  try {
    const accessToken = getCookie("accessToken");
    console.log("Access token:", accessToken);

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
      console.log("User data response:", data);
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
