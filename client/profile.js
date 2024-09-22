// profile.js

// Import Cookies library if using module bundler
// import Cookies from 'js-cookie'; // Uncomment if using module bundler
// Function to handle token errors
function handleTokenError() {
  window.location.href = "login.html";
}

// Function to refresh the token
async function refreshToken() {
  try {
    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/users/refresh-token`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === 200) {
        const { accessToken, refreshToken } = data.data;

        // Set tokens as cookies
        Cookies.set("accessToken", accessToken, {
          expires: 1,
          secure: false,
          sameSite: "Strict",
        });
        Cookies.set("refreshToken", refreshToken, {
          expires: 7,
          secure: false,
          sameSite: "Strict",
        });

        // Retry fetching the current user
        await fetchCurrentUser();
      } else {
        handleTokenError();
      }
    } else {
      handleTokenError();
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    handleTokenError();
  }
}

// Function to get cookie value by name
function getCookie(name) {
  return Cookies.get(name);
}
let userID = "";
// Function to fetch the current user's details
async function fetchCurrentUser() {
  try {
    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      throw new Error("Access token is missing");
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
        const user = data.data;
        userID = user._id;
        displayUserProfile(user);
        displayUserCoverImage(user);
      } else {
        console.error("Error fetching user data:", data.message);
        handleTokenError();
      }
    } else {
      if (response.status === 500) {
        await refreshToken();
      } else {
        console.error("HTTP error:", response.status, response.statusText);
        document.querySelector(".user-profile").textContent =
          "Failed to load user data. Please check your connection and try again.";
      }
    }
  } catch (error) {
    console.error("Error:", error);
    handleTokenError();
  }
}

// Function to display user profile
function displayUserProfile(user) {
  const userProfileImg1 = document.querySelector(".user-profile img");
  const userProfileImg2 = document.querySelector("#profile-image");
  if (user.avatar) {
    userProfileImg1.src = userProfileImg2.src = user.avatar;
  } else {
    userProfileImg1.src =
      "https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png";
  }
  document.querySelector(".profile-details h1").textContent =
    user.fullName || "John Doe";
  document.querySelector(".profile-details h2").textContent =
    `@${user.username}` || "@johndoe";
}
function displayUserCoverImage(user) {
  const userCoverImg = document.querySelector("#cover-image");
  if (user.coverImage) {
    userCoverImg.src = user.coverImage;
  } else {
    userCoverImg.src =
      "https://media.sproutsocial.com/uploads/2f_facebook-cover-photo_labels@2x-1.png";
  }
}

async function updateProfileImage(event) {
  const file = event.target.files[0];
  if (!file) {
    console.error("No file selected");
    return;
  }

  try {
    // Display the selected image immediately
    const reader = new FileReader();
    reader.onload = function (e) {
      const profileImage = document.getElementById("profile-image");
      profileImage.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload the image to the server
    const formData = new FormData();
    formData.append("avatar", file);

    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      console.error("User is not authenticated");
      return;
    }

    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/users/updateAvatar`,
      {
        method: "PATCH",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    if (response.ok && data.status === 200) {
      // console.log("Profile image updated successfully");
      // console.log(data.data);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error("Failed to update profile image:", data.message);
      alert("Error: " + (data.message || "Failed to update profile image"));
    }
  } catch (error) {
    console.error("Error uploading profile image:", error);
  }
}

// Event listener for profile image input change
// document
//   .getElementById("profile-image-input")
//   .addEventListener("change", updateProfileImage);

// Function to handle the cover image update
async function updateCoverImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Display the selected image immediately
    const reader = new FileReader();
    reader.onload = function (e) {
      const coverImage = document.getElementById("cover-image");
      coverImage.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Upload the image to the server
    const formData = new FormData();
    formData.append("coverImage", file);

    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      console.error("User is not authenticated");
      alert("Error: User is not authenticated. Please log in.");
      return;
    }
    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/users/updateCoverImage`,
      {
        method: "PATCH",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Optionally include the token for verification
        },
      }
    );

    const data = await response.json();
    if (response.ok && data.status === 200) {
      console.log("Cover image updated successfully");
      //reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error("Failed to update cover image:", data.message);
      alert("Error: " + (data.message || "Failed to update cover image"));
    }
  } catch (error) {
    console.error("Error uploading cover image:", error);
  }
}


// Function to remove cover image
async function removeCoverImage() {
  try {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      console.error("User is not authenticated");
      return;
    }

    const response = await fetch('https://mytubeapp.onrender.com/api/v1/users/removeCoverImage', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include' // Include cookies for session
    });
    
    console.log(response);
    const data = await response.json();
    console.log(data);
    if (response.ok && data.status === 200) {
      console.log("Cover image removed successfully");
      const userCoverImg = document.querySelector("#cover-image");
      userCoverImg.src =
      "https://media.sproutsocial.com/uploads/2f_facebook-cover-photo_labels@2x-1.png" ;
      //reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error("Failed to remove cover image:", data.message);
      alert("Error: " + (data.message || "Failed to remove cover image"));
    }
  } catch (error) {
    console.error("Error removing cover image:", error);
  }
}



// Function to toggle cover image options
function toggleCoverImageOptions() {
  const options = document.querySelector(".cover-image-options");
  options.style.display = options.style.display === "block" ? "none" : "block";
}

// Function to toggle edit profile form
function toggleEditProfileForm() {
  const formContainer = document.getElementById("edit-profile-form-container");
  formContainer.style.display =
    formContainer.style.display === "block" ? "none" : "block";
}

// Function to log out the user
async function logoutUser() {
  try {
    // Check if the user is authenticated
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      console.error("User is not authenticated");
      return;
    }

    const response = await fetch(`https://mytubeapp.onrender.com/api/v1/users/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`, // Optionally include the token for verification
      },
    });

    if (response.ok) {
      // Clear cookies
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");

      // Redirect to login page
      window.location.href = "login.html";
    } else {
      console.error("Failed to log out");
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// Add event listener to Sign Out button

document.getElementById("upload-button").addEventListener("click", () => {
  window.location.href = "upload.html"; // or wherever upload.js is linked
});

document.addEventListener("DOMContentLoaded", async () => {
  await fetchCurrentUser();
  fetchCounts();
});

async function updateProfileDetails(event) {
  event.preventDefault();

  const newUsername = document.getElementById("new-username").value;
  const newEmail = document.getElementById("new-email").value;
  const newFullName = document.getElementById("new-fullname").value;

  const profileData = {
    username: newUsername || undefined,
    email: newEmail || undefined,
    fullName: newFullName || undefined,
  };

  try {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      console.error("User is not authenticated");
      return;
    }

    const response = await fetch(
      `${process.env.MyTube_APP_URL}/api/v1/users/updateAccount`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      }
    );

    const data = await response.json();
    if (response.ok && data.status === 200) {
      alert("Profile details updated successfully");
      location.reload();
    } else {
      console.error("Failed to update profile details:", data.message);
      alert(data.message || "Failed to update profile details");
    }
  } catch (error) {
    console.error("Error updating profile details:", error);
    alert(
      "Error: An error occurred while updating profile details. Please try again."
    );
  }
}

async function changePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;

  const passwordData = {
    currentPassword: currentPassword,
    newPassword: newPassword,
  };
  console.log(passwordData);
  try {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      console.error("User is not authenticateD");
      return;
    }

    const response = await fetch(
      `https://mytubeapp.onrender.com/api/v1/users/changePassword`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(passwordData),
      }
    );
    console.log(response);
    const data = await response.json();
    if (response.ok && data.status === 200) {
      alert("Password changed successfully");
      location.reload();
    } else {
      console.error("Failed to change password:", data.message);
      alert("Error: " + (data.message || "Failed to change password"));
    }
  } catch (error) {
    console.error("Error changing password:", error);
    alert(
      "Error: An error occurred while changing the password. Please try again."
    );
  }
}
async function fetchCounts() {
  try {
    const channelId = userID;
    // console.log("Channel ID: ", channelId);
    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      throw new Error("Access token is missing");
    }

    const [subscribersResponse, subscribedToResponse,views] = await Promise.all([
      fetch(
        `https://mytubeapp.onrender.com/api/v1/subscription/count-subscribers/${channelId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      ),
      fetch(`https://mytubeapp.onrender.com/api/v1/subscription/count-subscribed-to`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }),
      fetch(`https://mytubeapp.onrender.com/api/v1/video/views`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }),
    ]);
    // total no. of views of current user


    // console.log(subscribersResponse);
    const subscribersCount = await subscribersResponse.json();
    const subscribedToCount = await subscribedToResponse.json();
    const viewsCount = await views.json();

    document.querySelector(".profile-stats .stat:nth-child(1) h2").textContent =
      subscribersCount.data || 0;
    document.querySelector(".profile-stats .stat:nth-child(2) h2").textContent =
      subscribedToCount.data || 0;
    document.querySelector(".profile-stats .stat:nth-child(3) h2").textContent =
      viewsCount.data || 0;
  } catch (error) {
    console.error("Error fetching counts:", error);
  }
}

document
  .getElementById("sign-out-button")
  .addEventListener("click", logoutUser);
document
  .getElementById("edit-profile-form")
  .addEventListener("submit", updateProfileDetails);
document
  .getElementById("edit-password-form")
  .addEventListener("submit", changePassword);
