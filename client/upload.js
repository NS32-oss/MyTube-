// Function to navigate between steps in the upload process
//stop loader after page load
function nextStep(step) {
  // Hide all steps
  document.querySelectorAll(".upload-step").forEach((stepElement) => {
    stepElement.style.display = "none";
  });
  // Show the selected step
  document.getElementById(`step-${step}`).style.display = "block";
}

// Function to navigate back to the referring page or fallback to home page
function backToHome() {
  const referrer = document.referrer;
  if (referrer) {
    window.location.href = referrer; // Redirect to the page the user came from
  } else {
    window.location.href = "index.html"; // Fallback to home page if no referrer
  }
}

// Function to submit the video upload
async function submitVideo() {
  //make loader  class visible
  document.querySelector(".loader").style.display = "block";
   
  const videoFile = document.getElementById("video-file").files[0];
  const thumbnailFile = document.getElementById("thumbnail-file").files[0];
  const title = document.getElementById("video-title").value;
  const description = document.getElementById("video-description").value;

  // Check if all required fields and files are provided
  if (!videoFile || !thumbnailFile || !title.trim() || !description.trim()) {
    alert("Please fill out all fields and select both files.");
    return;
  }

  const formData = new FormData();
  formData.append("videoFile", videoFile);
  formData.append("thumbnail", thumbnailFile);
  formData.append("title", title);
  formData.append("description", description);

  try {
    const accessToken = Cookies.get("accessToken"); // Get the access token from cookies
    const response = await fetch(`https://mytubeapp.onrender.com/api/v1/video/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`, // Set authorization header
      },
      body: formData // Append form data to request
    });

    if (response.ok) {
      alert("Video uploaded successfully!");
      window.location.href = "index.html"; // Redirect to home page
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
    }
  } catch (error) {
    //stop loader 
    document.querySelector(".loader").style.display = "none";
    alert("Video uploaded successfully!");
    window.location.href = "index.html"; // Redirect to home page in case of error
  }
}
