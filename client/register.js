// Function to handle user registration
async function registerUser() {
  // Remove success class from all submit buttons
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  submitButtons.forEach((button) => button.classList.remove("success"));

  // Create a FormData object from the registration form
  const formElement = document.getElementById("register-form-element");
  const formData = new FormData(formElement);

  try {
      // Send a POST request to the registration endpoint
      const response = await fetch(`${process.env.MyTube_APP_URL}/api/v1/users/register`, {
          method: "POST",
          body: formData,
      });

      // Parse the JSON response
      const data = await response.json();

      // Check if the response was successful
      if (response.ok) {
          if (data.status === 201 && data.message === "User registered successfully") {
              // Display success message and redirect to login page
              const successMessage = document.getElementById("register-success-message");
              successMessage.textContent = "Registration successful!";
              successMessage.style.display = "block";
              setTimeout(() => {
                  window.location.href = "login.html"; // Redirect after 700ms
              }, 700);
          }
      } else {
          // Display error message if registration fails
          const generalError = document.getElementById("register-general-error");
          generalError.textContent = data.message || "User already exists with the username or email";
          generalError.style.display = "block";
      }
  } catch (error) {
      // Display error message if an exception occurs
      const generalError = document.getElementById("register-general-error");
      generalError.textContent = "Something went wrong. Please try again.";
      generalError.style.display = "block";
  }
}
