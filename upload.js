function nextStep(step) {
    // Hide all steps
    document.querySelectorAll('.upload-step').forEach(stepElement => {
        stepElement.style.display = 'none';
    });
    // Show the selected step
    document.getElementById(`step-${step}`).style.display = 'block';
}

function backToHome() {
    const referrer = document.referrer;
    if (referrer) {
        window.location.href = referrer; // Redirect to the page the user came from
    } else {
        window.location.href = 'index.html'; // Fallback to home page if no referrer
    }
}


function submitVideo() {
    const videoFile = document.getElementById('video-file').files[0];
    const thumbnailFile = document.getElementById('thumbnail-file').files[0];
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;

    if (videoFile && thumbnailFile && title && description) {
        // Create a FormData object
        const formData = new FormData();
        formData.append('videoFile', videoFile);
        formData.append('thumbnail', thumbnailFile);
        formData.append('title', title);
        formData.append('description', description);

        // Send form data to your backend API
        fetch('http://localhost:8000/api/v1/video/', { // Updated endpoint
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Handle response from your backend
            if (data.message === "Video uploaded successfully") {
                showSuccessMessage();
            } else {
                console.error('Upload failed:', data.message);
                alert('Upload failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    } else {
        alert('Please complete all steps.');
    }
}

function showSuccessMessage() {
    const messageElement = document.getElementById('message');
    messageElement.textContent = 'Video upload successful! Redirecting to home page...';
    messageElement.style.display = 'block';

    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html'; // Redirect to home page
    }, 2000); // Delay in milliseconds
}
