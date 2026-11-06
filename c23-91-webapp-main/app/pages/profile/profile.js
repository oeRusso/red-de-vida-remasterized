document.addEventListener("DOMContentLoaded", function () {
  const numeroTotalDonacionesEl = document.getElementById(
    "numero-total-donaciones"
  );
  const numeroTotalPuntosEl = document.getElementById("userTotalPoints");

  async function loadFormData() {
    const spinner = document.getElementById("spinner");
    spinner.style.display = "block";
    const userID = localStorage.getItem("userID");
    try {
      const response = await fetch(`${config.API_URL}/users/${userID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: ` Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const data = await response.json();
      const user = data.payload.user;
      console.log(user);
      const userDonationsArray = data.payload.user.donations;
      const userTotalDonations = userDonationsArray.length;
      numeroTotalDonacionesEl.textContent = userTotalDonations;

      const userTotalPoints = data.payload.user.totalPoints;
      numeroTotalPuntosEl.textContent = userTotalPoints;

      updateLevelProgress(userTotalPoints);

      const birthdayDate = new Date(user.birthday);
      const year_app = birthdayDate.getFullYear();
      const monthIndex = birthdayDate.getMonth();
      const day_app = String(birthdayDate.getDate()).padStart(2, "0");

      document.getElementById("inputName").value = `${user.firstName || ""} ${
        user.lastName || ""
      }`.trim();
      document.getElementById("inputEmail").value = user.email || "";
      document.getElementById("inputBloodType").value = user.bloodType || "";
      document.getElementById("inputBithday").value =
        `${day_app} / ${monthIndex} / ${year_app}` || "";
      document.getElementById("inputGender").value =
        user.gender === "Male" ? "Hombre" : "Mujer";

      if (user.diseases.length > 0) {
        document.getElementById("inputDiseases").value = "Si";
        user.diseases.forEach((disease) => {
          const pillContainer = document.getElementById("selectedDiseases");
          const pill = createDiseasePill(
            disease.name.toLowerCase(),
            disease.name
          );
          pillContainer.appendChild(pill);
        });
      } else if (user.diseases === 0) {
        document.getElementById("inputDiseases").value = "No";
      }
    } catch (error) {
      console.error("Error al cargar los datos del formulario:", error);
    } finally {
      document.getElementById("profile-content").classList.remove("d-none");
      spinner.style.display = "none";
    }
  }

  loadFormData();
});

function createDiseasePill(diseaseValue, diseaseName) {
  const pill = document.createElement("span");
  pill.className = "badge bg-secondary text-primary rounded-pill ms-1";
  pill.dataset.value = diseaseValue;
  pill.textContent = diseaseName;

  return pill;
}

function updateLevelProgress(userPoints) {
  const userLevelPoints = 90;

  // Calcular nivel actual y progreso dentro del nivel
  let nivel = Math.floor(userPoints / userLevelPoints);
  let progreso = ((userPoints % userLevelPoints) / userLevelPoints) * 100;

  // Actualizar la UI
  document.getElementById("level-label").textContent = `Nivel ${nivel}`;
  document.getElementById("progress-bar").style.width = `${progreso}%`;
  document.getElementById("progress-percentage").textContent = `${Math.round(
    progreso
  )}%`;
}

document.addEventListener("DOMContentLoaded", function () {
  const cancelarCuenta = document.getElementById("cancelar-cuenta");

  cancelarCuenta.addEventListener("click", () => {
    let cerrarCuentaMensaje = document.getElementById("cerrar-cuenta-mensaje");

    if (!cerrarCuentaMensaje) {
      console.error(
        "❌ Error: <div id='cerrar-cuenta-mensaje'> not found in the DOM!"
      );
      return; // Stop execution if the element doesn't exist
    }

    // Correcting the class manipulation
    cerrarCuentaMensaje.classList.remove("d-none");
    cerrarCuentaMensaje.classList.add("d-block");

    // Insert the warning message with buttons
    cerrarCuentaMensaje.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center text-center">
        <p class="m-2" style="font-size: 0.8rem">Esta acción borrará todos sus datos de usuario, donaciones y citas y cerrará permanentemente su cuenta</p>
        <div class="d-flex gap-2 justify-content-center">
          <button id="continuar" class="btn btn-primary rounded-pill border-0 bg-primary text-white" style="font-size: 0.7rem;">Cancelar suscripción</button>
          <button id="regresar" class="btn btn-primary rounded-pill border-0 bg-primary text-white" style="font-size: 0.7rem;">Mantener suscripción</button>
        </div>
      </div>
    `;

    // Add event listeners after DOM update
    setTimeout(() => {
      const continuarBtn = document.getElementById("continuar");
      const regresarBtn = document.getElementById("regresar");

      if (continuarBtn) {
        continuarBtn.addEventListener("click", () => {
          console.log("Boton de cancelar suscripcion presionado");

          const userID = localStorage.getItem("userID");

          if (!userID) {
            console.error("❌ Error: userId not found in Local Storage.");
          } else {
            console.log("✅ userId retrieved:", userID);

            fetch(`${config.API_URL}/users/${userID}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            })
              .then((response) => {
                if (!response.ok) {
                  return response.text().then((text) => {
                    throw new Error(text);
                  });
                }
                return response.json();
              })
              .then((data) => {
                console.log("✅ User deleted successfully:", data);
                localStorage.removeItem("userID");
                localStorage.removeItem("token");
              })
              .catch((error) => {
                console.error("❌ Error deleting user:", error);
              });
          }

          cancelarCuenta.classList.add("d-none");
          cerrarCuentaMensaje.innerHTML = `
            <p class="text-center">Todos sus datos personales, donaciones y citas agendadas han sido borrados y su suscripción ha sido cancelada.</p>
            <div class="d-flex flex-column align-items-center justify-content-center text-center">
              <button id="finalizar" class="btn btn-primary rounded-pill border-0 bg-primary text-white" style="font-size: 0.7rem;">Finalizar</button>
            </div>
          `;

          // Finalizar event listener
          setTimeout(() => {
            const finalizarBtn = document.getElementById("finalizar");
            if (finalizarBtn) {
              finalizarBtn.addEventListener("click", () => {
                const isLocal =
                  window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1";
                const targetUrl = isLocal ? "/app/index.html" : "/index.html";

                setTimeout(() => {
                  window.location.href = targetUrl;
                }, 2000);
              });
            }
          }, 0);
        });
      }

      if (regresarBtn) {
        regresarBtn.addEventListener("click", () => {
          console.log("Boton de regresar ha sido presionado");
          cerrarCuentaMensaje.classList.add("d-none");
          cerrarCuentaMensaje.innerHTML = "";
        });
      }
    }, 0);
  });
});
