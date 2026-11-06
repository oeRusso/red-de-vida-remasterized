const inputEmailEl = document.getElementById("inputEmail");
const passwordInput = document.getElementById("inputPassword");
const togglePasswordButton = document.getElementById("togglePassword");

togglePasswordButton.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  togglePasswordButton.innerHTML =
    type === "password"
      ? '<i class="bi bi-eye"></i>'
      : '<i class="bi bi-eye-slash"></i>';
});

async function logUser(event) {
  event.preventDefault();

  const userData = {
    email: inputEmailEl.value,
    password: passwordInput.value,
  };

  try {
    const response = await fetch(`${config.AUTH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer <'your message'>`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      console.log(data);
      localStorage.setItem("token", data.payload.token);
      localStorage.setItem("userID", data.payload.user.id);
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const targetUrl = isLocal
        ? "/app/pages/awards/awards.html"
        : "/pages/awards/awards.html";

      console.log("Redirecting to:", targetUrl);
      window.location.href = targetUrl;
      console.log("This is target URL: " + targetUrl);
    } else {
      document.getElementById("error-alert").innerHTML = `
        <div class="alert alert-danger d-flex align-items-center" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            <div>
                ${data.message}
            </div>
        </div>`;
    }
  } catch (error) {
    console.error("Error during login:", error);
    document.getElementById("error-alert").innerHTML = `
        <div class="alert alert-danger d-flex align-items-center" role="alert">
            <i class="bi bi-check-circle me-2"></i>
            <div>
                El email y / o la contraseña ingresados no se registran en nuestra base de datos. Intentelo nuevamente.
            </div>
        </div>`;
  }

  inputEmailEl.value = "";
  passwordInput.value = "";
}
