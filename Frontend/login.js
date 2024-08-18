// Set cookies using Cookies library
function setCookie(name, value, days, secure = false) {
  Cookies.set(name, value, { expires: days, secure: secure, sameSite: 'Strict' });
}

// Display error messages
function displayError(message) {
  const generalError = document.getElementById("login-general-error");
  if (generalError) {
    generalError.textContent = message;
    generalError.style.display = "block";
  }
}

// Handle user login
async function loginUser() {
  // Remove success class from all submit buttons
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  submitButtons.forEach((button) => button.classList.remove("success"));

  // Prepare form data
  const formElement = document.getElementById("login-form-element");
  const formData = new FormData(formElement);
  const loginButton = formElement.querySelector('button[type="submit"]');

  try {
    // Send login request
    const response = await fetch("http://localhost:8000/api/v1/users/login", {
      method: "POST",
      body: new URLSearchParams(formData),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
    });

    // Parse response data
    const data = await response.json();

    // Check if login was successful
    if (response.ok && data.status === 200 && data.message === "User logged in successfully") {
      const successMessage = document.getElementById("login-success-message");
      if (successMessage) {
        successMessage.textContent = "Login successful!";
        successMessage.style.display = "block";
      }

      const { accessToken, refreshToken } = data.data;

      // Set cookies using Cookies library
      setCookie('accessToken', accessToken, 2);  // No secure attribute for local testing
      setCookie('refreshToken', refreshToken, 7); // Assuming refresh token is valid for 7 days

      // Update button style and redirect after a delay
      loginButton.classList.add("success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } else {
      // Display error if login was unsuccessful
      displayError(data.message || "User credentials are invalid");
    }
  } catch (error) {
    // Handle and display errors
    displayError("An error occurred. Please try again.");
  }
}
