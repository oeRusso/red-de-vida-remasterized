let user;
let nextDonationDate;
document.addEventListener("DOMContentLoaded", function () {
  // Load user data in 'datos personales' form
  async function loadFormData() {
    const spinner = document.getElementById("spinner");
    spinner.style.display = "block";
    const userID = localStorage.getItem("userID");
    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${userID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: ` Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const data = await response.json();
      user = data.payload.user;
      console.log(data);

      if (data.payload.lastAppointment === null) {
        console.log("No hay citas previas");
      } else if (data.payload.lastAppointment.status === "Pending") {
        document
          .getElementById("pendingDate-alert")
          .classList.replace("d-none", "d-flex");
        document.getElementById("next-button1").disabled = true;
      } else if (data.payload.lastAppointment.status === "Completed") {
        const mydate = data.payload.lastAppointment.donationDate;
        nextDonationDate = new Date(nextDonation(user.gender, mydate))
          .toISOString()
          .split("T")[0];
        console.log(nextDonationDate);
        document
          .getElementById("nextDate-alert")
          .classList.replace("d-none", "d-flex");
      }

      document.getElementById("inputName").value = user.firstName || "";
      document.getElementById("inputLastName").value = user.lastName || "";
      document.getElementById("inputEmail").value = user.email || "";
      document.getElementById("bloodTypeSelect").value = user.bloodType || "";

      if (user.diseases.length > 0) {
        document.getElementById("diseaseYes").checked = true;
        user.diseases.forEach((disease) => {
          const pillContainer = document.getElementById("selectedDiseases");
          const pill = createDiseasePill(
            disease.name.toLowerCase(),
            disease.name
          );
          pillContainer.appendChild(pill);
        });
      } else if (user.diseases === 0) {
        document.getElementById("diseaseNo").checked = false;
      }
    } catch (error) {
      console.error("Error al cargar los datos del formulario:", error);
    } finally {
      document.getElementById("step-1-content").classList.remove("d-none");
      spinner.style.display = "none";
    }
  }

  // Call function on window load
  loadFormData();
});

function nextDonation(gender, donationDate) {
  let date = new Date(donationDate);
  let monthsToAdd = gender === "Female" ? 4 : 3;

  date.setMonth(date.getMonth() + monthsToAdd);

  return date.toISOString();
}

function createDiseasePill(diseaseValue, diseaseName) {
  const diseasesPills = document.getElementById("selectedDiseases").children;

  const pill = document.createElement("span");
  pill.className = "badge bg-secondary text-primary p-2 rounded-pill";
  pill.dataset.value = diseaseValue;
  pill.textContent = diseaseName;

  pill.addEventListener("click", () => {
    pill.remove();
    if (diseasesChanged(diseasesPills, user.diseases)) {
      document.getElementById("btn-updateUser").disabled = false;
      document.getElementById("next-button1").disabled = true;
    } else {
      document.getElementById("btn-updateUser").disabled = true;
      docuemnt.getElementById("next-button1").disabled = false;
    }
  });

  return pill;
}

function diseasesChanged(diseasesPills, diseasesServer) {
  if (diseasesPills.length !== diseasesServer.length) return true;
  const userDiseasesNames = diseasesServer
    .map((disease) => disease.name.toLowerCase())
    .sort();
  const newUserDiseasesNames = [...diseasesPills]
    .map((disease) => disease.dataset.value)
    .sort();
  return !userDiseasesNames.every(
    (disease, index) => disease === newUserDiseasesNames[index]
  );
}

function userAddDisease(event) {
  const select = event.target;
  const selectedDiseasesContainer = document.getElementById("selectedDiseases");
  const diseasesPills = selectedDiseasesContainer.children;

  // Add disease to div
  const disease = select.value;

  // Create disease pill if not alredy exists
  if (![...diseasesPills].some((pill) => pill.dataset.value === disease)) {
    const pill = createDiseasePill(
      disease,
      select.options[select.selectedIndex].text
    );
    selectedDiseasesContainer.appendChild(pill);

    if (diseasesChanged(diseasesPills, user.diseases)) {
      document.getElementById("btn-updateUser").disabled = false;
      document.getElementById("next-button1").disabled = true;
    } else {
      document.getElementById("btn-updateUser").disabled = true;
      document.getElementById("next-button1").disabled = false;
    }
  }
  // Reset select value
  select.value = "";
}

// Unable and disable update button
function userDataChange(event) {
  const input = event.target;
  const value = input.value;
  if (value !== user[input.dataset.field]) {
    document.getElementById("btn-updateUser").disabled = false;
    document.getElementById("next-button1").disabled = true;
  } else {
    document.getElementById("btn-updateUser").disabled = true;
    document.getElementById("next-button1").disabled = false;
  }
}

async function nextStep(currentStep) {
  document.getElementById(`step-${currentStep}`).classList.add("d-none");

  // Stepper styles
  const nextStep = currentStep + 1;
  document
    .getElementById(`step-${nextStep}`)
    .classList.replace("d-none", "d-flex");

  document
    .getElementById(`step-circle-${nextStep}`)
    .classList.replace("bg-light", "bg-primary");
  document
    .getElementById(`step-circle-${nextStep}`)
    .classList.replace("text-dark", "text-white");

  if (document.getElementById(`line-${currentStep}`)) {
    document
      .getElementById(`line-${currentStep}`)
      .classList.add("border-primary");
  }

  if (currentStep === 1) {
    calendarInicialization();
    try {
      const response = await fetch("http://localhost:8080/api/institutions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los hospitales");
      }
      const data = await response.json();
      const institutions = data.payload;

      const institutionSelect = document.getElementById("institutionSelect");
      institutions.forEach((hospital) => {
        const option = document.createElement("option");
        option.value = hospital._id;
        option.textContent = hospital.name;
        institutionSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error al cargar los hospitales:", error);
    }
  }
}

async function updateUser(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const data = {
    firstName: formData.get("name") || "",
    lastName: formData.get("lastName") || "",
    bloodType: formData.get("bloodType") || null,
    email: formData.get("email") || "",
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

  await fetch(
    `http://localhost:8080/api/users/${localStorage.getItem("userID")}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      Authorization: ` Bearer ${localStorage.getItem("token")}`,
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        console.log("User registered:", data);
        document.getElementById("next-button1").disabled = false;
        document.getElementById("btn-updateUser").disabled = true;
      } else {
        //   alert( `Error: ${data.message}`);
      }
    })
    .catch((error) => {
      console.error("Error during registration:", error);
      alert("An error occurred during registration. Please try again later.");
    });
}

// Create an array of available times based on the hospital's schedule
function generateTimes(schedules) {
  const [openTime, closeTime] = schedules;
  const availableTimes = [];

  const [oH, oM] = openTime.split(":").map(Number);
  const [cH, cM] = closeTime.split(":").map(Number);

  // Convert openHours and closeHours to minutes
  let start = oH * 60 + oM;
  const end = cH * 60 + cM;

  // Generate times in 30-minute intervals
  while (start + 30 <= end) {
    const hora = Math.floor(start / 60);
    const minutos = start % 60;
    availableTimes.push(
      `${hora.toString().padStart(2, "0")}:${minutos
        .toString()
        .padStart(2, "0")}`
    );
    start += 30;
  }

  return availableTimes;
}

// Join date and hour selected by user
function combinarFechaHora(fecha, hora) {
  const [horaSeleccionada, minutosSeleccionados] = hora.split(":").map(Number);

  const fechaCompleta = new Date(fecha);
  fechaCompleta.setUTCHours(horaSeleccionada, minutosSeleccionados, 0, 0);
  fechaCompleta.setUTCMinutes(minutosSeleccionados);

  return fechaCompleta.toISOString(); // Convertir a ISO en UTC
}

let bookedAppointments = {};

let timesMondayToFriday = [];
let timesSaturday = [];
let timesSunday = [];

async function getHospitalSchedule(event) {
  const institutionId = event.target.value;
  try {
    const response = await fetch(
      `http://localhost:8080/api/institutions/${institutionId}/appointments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Error al cargar los hospitales");
    }
    const data = await response.json();
    const institution = data.payload;
    console.log(institution);

    bookedAppointments = {};

    timesMondayToFriday = generateTimes([
      institution.operatingHours.mondayToFriday.open,
      institution.operatingHours.mondayToFriday.close,
    ]);
    timesSaturday = generateTimes([
      institution.operatingHours.saturday.open,
      institution.operatingHours.saturday.close,
    ]);
    timesSunday = generateTimes([
      institution.operatingHours.sunday.open,
      institution.operatingHours.sunday.close,
    ]);

    institution.appointments.forEach((appointment) => {
      const date = new Date(appointment.appointmentDate);

      // Date format (YYYY-MM-DD)
      const formattedDate = date.toISOString().split("T")[0];

      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;

      // Agregar al objeto bookedAppointments
      if (!bookedAppointments[formattedDate]) {
        bookedAppointments[formattedDate] = []; // Crear el arreglo si no existe
      }
      bookedAppointments[formattedDate].push(formattedTime);
    });

    console.log(bookedAppointments);
  } catch (error) {
    console.error("Error al cargar los hospitales:", error);
  }
}

let appointmentDateSelected;
function calendarInicialization() {
  const minDate = nextDonationDate == null ? "today" : nextDonationDate;

  const calendar = flatpickr("#datepicker", {
    inline: true,
    dateFormat: "Y-m-d",
    // defaultDate: "today",
    defaultDate: minDate,
    minDate: minDate,
    maxDate: new Date(
      minDate === "today" ? new Date() : new Date(minDate)
    ).fp_incr(90),
    onReady: function () {
      const daysContainer = document.querySelector(".flatpickr-days");
      daysContainer.classList.add("gap-2");
    },
    onDayCreate: function (dObj, dStr, fp, dayElem) {
      // Disable days styles
      if (dayElem.classList.contains("flatpickr-disabled")) {
        dayElem.classList.add("bg-white", "text-muted"); // Fondo blanco y texto tenue
      }

      const date = dayElem.dateObj.toISOString().split("T")[0];
      if (dayElem.dateObj.getDay() === 0) {
        dayElem.classList.add(
          "bg-danger",
          "text-white",
          "border",
          "border-white"
        );
      }

      if (dayElem.dateObj.getDay() > 0 && dayElem.dateObj.getDay() <= 5) {
        if (
          bookedAppointments[date] &&
          bookedAppointments[date].length === timesMondayToFriday.length
        ) {
          dayElem.classList.add(
            "bg-primary",
            "text-white",
            "border",
            "border-white"
          );
        } else {
          dayElem.classList.add(
            "bg-secondary",
            "text-dark",
            "border",
            "border-white"
          );
        }
      } else if (dayElem.dateObj.getDay() === 6) {
        if (
          bookedAppointments[date] &&
          bookedAppointments[date].length === timesSaturday.length
        ) {
          dayElem.classList.add(
            "bg-primary",
            "text-white",
            "border",
            "border-white"
          );
        } else {
          dayElem.classList.add(
            "bg-secondary",
            "text-dark",
            "border",
            "border-white"
          );
        }
      }
    },
    onChange: function (selectedDates, dateStr) {
      const selectedDate = new Date(selectedDates[0]);
      const dayOfWeek = selectedDate.getDay();

      console.log(selectedDates[0]);
      console.log(dateStr);

      const timesContainer = document.getElementById("available-times");
      timesContainer.innerHTML = "";

      //Remove styles from previous selected day
      document.querySelectorAll(".flatpickr-day").forEach((day) => {
        day.classList.remove("border-black");
      });

      // Add black border to selected day
      const selectedDay = document.querySelector(".flatpickr-day.selected");
      if (selectedDay) {
        selectedDay.classList.replace("border-white", "border-primary");
      }

      const bookedTimes = bookedAppointments[dateStr] || [];
      // Filter available times based on the selected day
      let availableTimes;
      if (dayOfWeek === 0) {
        availableTimes = timesSunday.filter(
          (time) => !bookedTimes.includes(time)
        );
      } else if (dayOfWeek === 6) {
        availableTimes = timesSaturday.filter(
          (time) => !bookedTimes.includes(time)
        );
      } else {
        availableTimes = timesMondayToFriday.filter(
          (time) => !bookedTimes.includes(time)
        );
      }

      if (availableTimes.length > 0) {
        availableTimes.forEach((time) => {
          const pill = document.createElement("span");
          pill.className =
            "badge bg-secondary text-dark p-2 border rounded-pill";
          pill.textContent = time;
          timesContainer.appendChild(pill);

          pill.onclick = () => {
            // Remove previous selected time styles
            const previouslySelected =
              document.querySelector(".badge.bg-primary");
            if (previouslySelected) {
              previouslySelected.classList.remove("bg-primary", "text-white");
              previouslySelected.classList.add("bg-secondary", "text-dark");
            }
            appointmentDateSelected = combinarFechaHora(
              selectedDates[0],
              pill.textContent
            );
            pill.classList.remove("bg-secondary", "text-dark");
            pill.classList.add("bg-primary", "text-white");
          };
        });
      } else {
        timesContainer.innerHTML =
          '<span class="text-danger fw-bold">No hay horarios disponibles para este día</span>';
      }
    },
  });
}

function createAppointment(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const appointmentData = {
    appointmentDate: appointmentDateSelected,
    institutionId: formData.get("institutionSelect"),
    userId: localStorage.getItem("userID"),
    status: "Pending",
    notes: formData.get("notes") || "",
  };

  console.log(appointmentData);

  fetch("http://localhost:8080/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(appointmentData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        const divResponse = document.getElementById("step-3");
        divResponse.innerHTML = `
                    <i class="bi bi-check-circle-fill fs-1 text-success text-center"></i>
                    <h3 class="text-center">Tu cita se ha agendado correctamente</h3>
                    <p>Para ver todos los detalles ve al inicio </p>
                    <a href="../awards/awards.html" class="btn btn-primary">Ir al inicio</a>
                    `;
      } else {
        const divResponse = document.getElementById("step-3");
        divResponse.innerHTML = `
                    <i class="bi bi-x-circle-fill fs-1 text-primary text-center"></i>
                    <h3 class="text-center">Hubo un error al agendar la cita</h3>
                    <p>Ocurrió un error, intentalo más tarde</p>
                    <a href="../awards/awards.html" class="btn btn-primary">Ir al inicio</a>
                    `;
      }
    })
    .catch((error) => {
      const divResponse = document.getElementById("step-3");
      divResponse.innerHTML = `
                <i class="bi bi-x-circle-fill fs-1 text-primary text-center"></i>
                <h3 class="text-center">Hubo un error al agendar la cita</h3>
                <p>Ocurrió un error, intentalo más tarde</p>
                <a href="../awards/awards.html" class="btn btn-primary">Ir al inicio</a>
                `;
    });
}
