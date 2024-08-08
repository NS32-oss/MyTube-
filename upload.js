function nextStep(step) {
  // Hide all steps
  document.querySelectorAll(".upload-step").forEach((stepElement) => {
    stepElement.style.display = "none";
  });
  // Show the selected step
  document.getElementById(`step-${step}`).style.display = "block";
}
function backToHome() {
  const referrer = document.referrer;
  if (referrer) {
    window.location.href = referrer; // Redirect to the page the user came from
  } else {
    window.location.href = "index.html"; // Fallback to home page if no referrer
  }
}

// function showSuccessMessage() {
//     const messageElement = document.getElementById('message');
//     messageElement.textContent = 'Video upload successful! Redirecting to home page...';
//     messageElement.style.display = 'block';

//     // Redirect to home page after a short delay
//     setTimeout(() => {
//         window.location.href = 'index.html'; // Redirect to home page
//     }, 2000); // Delay in milliseconds
// }

async function submitVideo() {
  const videoFile = document.getElementById("video-file").files[0];
  const thumbnailFile = document.getElementById("thumbnail-file").files[0];
  const title = document.getElementById("video-title").value;
  const description = document.getElementById("video-description").value;

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
    const accessToken = Cookies.get("accessToken");

    const response = await fetch("http://localhost:8000/api/v1/video/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData
    });
    console.log(response);
    if (response.ok) {
      const data = await response.json();
      alert("Video uploaded successfully!");
      window.location.href = "index.html"; // Redirect to home page
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
    }
  } catch (error) { 
    console.error("Error uploading video:", error);
    
    // alert("Video uploaded successfully!");
    // window.location.href = "index.html";
  }
}
