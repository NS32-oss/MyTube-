async function registerUser() {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach((button) => button.classList.remove("success"));
  
    const formElement = document.getElementById("register-form-element");
    const formData = new FormData(formElement);
  
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/register", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        if (data.status === 201 && data.message === "User registered successfully") {
          const successMessage = document.getElementById("register-success-message");
          successMessage.textContent = "Registration successful!";
          successMessage.style.display = "block";
          setTimeout(() => {
            window.location.href = "login.html"; 
          }, 700); 
        }
      } else {
        const generalError = document.getElementById("register-general-error");
        generalError.textContent = data.message || "User already exists with the username or email";
        generalError.style.display = "block";
      }
    } catch (error) {
      console.error("Error:", error);
      const generalError = document.getElementById("register-general-error");
      generalError.textContent = "Something went wrong. Please try again.";
      generalError.style.display = "block";
    }
  }
  