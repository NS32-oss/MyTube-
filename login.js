// Set cookies using Cookies library
function setCookie(name, value, days, secure = false) {
  Cookies.set(name, value, { expires: days, secure: secure, sameSite: 'Strict' });
}

function displayError(message) {
  const generalError = document.getElementById("login-general-error");
  if (generalError) {
    generalError.textContent = message;
    generalError.style.display = "block";
  }
}

async function loginUser() {
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  submitButtons.forEach((button) => button.classList.remove("success"));

  const formElement = document.getElementById("login-form-element");
  const formData = new FormData(formElement);
  const loginButton = formElement.querySelector('button[type="submit"]');

  try {
    const response = await fetch("http://localhost:8000/api/v1/users/login", {
      method: "POST",
      body: new URLSearchParams(formData),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
    });

    const data = await response.json();
    console.log("Login response:", data);

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

      console.log("Cookies set:", Cookies.get());

      loginButton.classList.add("success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 700);
    } else {
      displayError(data.message || "User credentials are invalid");
    }
  } catch (error) {
    console.error("Error:", error);
    displayError("An error occurred. Please try again.");
  }
}
