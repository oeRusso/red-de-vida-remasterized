window.onload = () => {
  const select = document.getElementById("diseasesSelect");
  const selectedDiseasesContainer = document.getElementById("selectedDiseases");

  // Manage section
  select.addEventListener("change", () => {
    const disease = select.value;

    // Avoid duplicated pills
    if (
      ![...selectedDiseasesContainer.children].some(
        (pill) => pill.dataset.value === disease
      )
    ) {
      const pill = document.createElement("span");
      pill.className = "badge bg-secondary text-primary p-2 rounded-pill";
      pill.dataset.value = disease;
      pill.textContent = select.options[select.selectedIndex].text;

      // Delete pill on event
      pill.addEventListener("click", () => {
        pill.remove();
      });

      selectedDiseasesContainer.appendChild(pill);
    }
    // Reset select value
    select.value = "";
  });

  const passwordInput = document.getElementById("inputPassword");
  const togglePasswordButton = document.getElementById("togglePassword");

  togglePasswordButton.addEventListener("click", () => {
    // Cambiar tipo de input
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;

    // Cambiar icono (opcional)
    togglePasswordButton.innerHTML =
      type === "password"
        ? '<i class="bi bi-eye"></i>'
        : '<i class="bi bi-eye-slash"></i>';
  });
};

function birthdayValidation(event) {
  const input = event.target;
  const selectedDate = new Date(input.value);
  const today = new Date();

  let age = today.getFullYear() - selectedDate.getFullYear();

  const monthDifference = today.getMonth() - selectedDate.getMonth();
  const dayDifference = today.getDate() - selectedDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  if (age >= 18) {
    input.classList.remove("is-invalid");
  } else {
    input.classList.add("is-invalid");
  }
}

function createUser(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const data = {
    firstName: formData.get("name") || "",
    lastName: formData.get("lastName") || "",
    birthday: formData.get("birthday"),
    gender: formData.get("gender") || null,
    bloodType: formData.get("bloodType") || null,
    email: formData.get("email") || "",
    password: formData.get("password") || "",
    diseases: [],
  };

  const selectedDiseases = Array.from(
    document.querySelectorAll("#selectedDiseases .badge")
  ).map((pill) => ({
    name: pill.textContent.trim(),
    diagnosedDate: null,
    notes: "",
  }));

  data.diseases = selectedDiseases;

  console.log(data);

  fetch("http://localhost:8080/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document
          .getElementById("succes-alert")
          .classList.replace("d-none", "d-flex");
        console.log("User registered:", data);
        const absoluteUrl = `${window.location.origin}/app/pages/login/login.html`;
        setTimeout(() => {
          window.location.href = absoluteUrl;
        }, 3000);
      } else {
        const alertError = document.getElementById("error-alert");
        alertError.innerHTML = `
          <div class="alert alert-danger align-items-center d-flex" role="alert">
            <i class="bi bi-x-circle-fill fs-3 text-danger text-center me-3"></i>
            <div>
             ${data.message}
            </div>
          </div>`;
      }
    })
    .catch((error) => {
      const alertError = document.getElementById("error-alert");
      alertError.innerHTML = `
          <div class="alert alert-danger align-items-center d-flex" role="alert">
            <i class="bi bi-x-circle-fill fs-3 text-danger text-center me-3"></i>
            <div>
             Ocurrió un error, intentalo mas tarde
            </div>
          </div>`;
      console.error("Error during registration:", error);
    });
}
