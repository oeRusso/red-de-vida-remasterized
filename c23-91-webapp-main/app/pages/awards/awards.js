const mes_ult_don_El = document.getElementById("mes_ult_don");
const dia_ult_don_El = document.getElementById("dia_ult_don");
const anio_ult_don_El = document.getElementById("anio_ult_don");
const mes_prox_cita_El = document.getElementById("mes_prox_cita");
const dia_prox_cita_El = document.getElementById("dia_prox_cita");
const anio_prox_cita_El = document.getElementById("anio_prox_cita");
const cancelar_cita_El = document.getElementById("cancelar_cita");
const cita_content_El = document.getElementById("cita_content");
let cita_cancelada_El = document.getElementById("cita-cancelada");
const estado_El = document.getElementById("estado");
let mapFrameDonEl = document.getElementById("mapFrameDon");
let mapFrameCitEl = document.getElementById("mapFrameCit");
let nombre_hosp_ult_don_El = document.getElementById("nombre_hosp_ult_don");
let nombre_hosp_prox_cita_El = document.getElementById("nombre_hosp_prox_cita");
const bloodIcon = document.getElementById("blood-icon");
let sitio_Web_Link_Don = document.querySelector(
  ".d-flex.align-items-center.gap-2.text-decoration-underline"
);
let sitio_Web_Link_Cit = document.querySelector(
  ".text-decoration-underline.mt-5"
);
const link_Citas_El = document.querySelector(".text-center.m-2.mb-3");
let appointmentId;
let lastDonationHospital = "";
let nextAppointmentHospital = "";
let currentPage = 1;
const donationsPerPage = 8;
let donationsData = [];
const userID = localStorage.getItem("userID");
const medalOneEl = document.getElementById("medal-one");
const medalTwoEl = document.getElementById("medal-two");
const medalThreeEl = document.getElementById("medal-three");
const medalFourEl = document.getElementById("medal-four");
const medalFiveEl = document.getElementById("medal-five");
const medalSixEl = document.getElementById("medal-six");

const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

const hospitales = [
  {
    name: "Hospital El Cruce",
    address:
      "Av. Calchaquí 5401, B1888 Florencio Varela, Provincia de Buenos Aires",
    website: "https://www.hospitalelcruce.org/",
    url: "https://www.google.com/maps?q=Av.+Calchaquí+5401,+B1888+Florencio+Varela,+Provincia+de+Buenos+Aires&output=embed",
  },
  {
    name: "Clínica del Sol",
    address: "Av. Coronel Díaz 2211, C1425 Cdad. Autónoma de Buenos Aires",
    website: "https://www.cdelsol.com.ar/cdelsol/",
    url: "https://www.google.com/maps?q=Av.+Coronel+Díaz+2211,+C1425+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Banco de Sangre de Buenos Aires",
    address: "Av. Díaz Vélez 3973, Cdad. Autónoma de Buenos Aires",
    website: "https://www.hemocentro.org/",
    url: "https://www.google.com/maps?q=Av.+Díaz+Vélez+3973,+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Hospital de Clínicas 'Dr. Alberto de Zara'",
    address: "Av. Córdoba 2351, C1120 Cdad. Autónoma de Buenos Aires",
    website: "https://portal.hospitaldeclinicas.uba.ar/",
    url: "https://www.google.com/maps?q=Av.+Córdoba+2351,+C1120+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Hospital Italiano de Buenos Aires",
    address: "Perón 4190, Almagro, Cdad. Autónoma de Buenos Aires",
    website: "https://www.hospitalitaliano.org.ar/",
    url: "https://www.google.com/maps?q=Perón+4190,+Almagro,+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Clínica Zabala",
    address: "Av. Cabildo 1295, C1426AAM Cdad. Autónoma de Buenos Aires",
    website: "https://www.swissmedical.com.ar/clinewsite/zabala/",
    url: "https://www.google.com/maps?q=Av.+Cabildo+1295,+C1426AAM+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Hospital de Niños 'Ricardo Gutiérrez'",
    address: "Gallo 1330, Recoleta, Cdad. Autónoma de Buenos Aires",
    website:
      "https://buenosaires.gob.ar/salud/hospitales-y-establecimientos-de-salud/hospital-de-ninos-dr-ricardo-gutierrez",
    url: "https://www.google.com/maps?q=Gallo+1330,+Recoleta,+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Instituto del Cáncer de la Fundación Favaloro",
    address: "Av. Belgrano 1746, Cdad. Autónoma de Buenos Aires",
    website: "https://www.fundacionfavaloro.org/",
    url: "https://www.google.com/maps?q=Av.+Belgrano+1746,+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Banco Central de Sangre",
    address: "Av. Díaz Vélez 3973, Cdad. Autónoma de Buenos Aires",
    website: "https://www.hemocentro.org/",
    url: "https://www.google.com/maps?q=Av.+Díaz+Vélez+3973,+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Hospital Militar Central 'Cirujano Mayor Dr. Cosme Argerich'",
    address: "Av. Luis María Campos 726-800, Cdad. Autónoma de Buenos Aires",
    website: "https://www2.hmc.mil.ar/",
    url: "https://www.google.com/maps?q=Av.+Luis+María+Campos+726-800,+Ciudad+Autónoma+de+Buenos+Aires&output=embed",
  },
  {
    name: "Hospital Central",
    address: "L. N. Alem &, M5502 Salta, Mendoza",
    website:
      "https://www.facebook.com/people/Hospital-Central-de-Mendoza/100068122383336/#",
    url: "https://www.google.com/maps?q=L.+N.+Alem+%26,+M5502+Salta,+Mendoza&output=embed",
  },
  {
    name: "Clínica Norte",
    address: "25 de Mayo 138 - 4200 Santiago del Estero",
    website: "https://sanatorionorte.com/",
    url: "https://www.google.com/maps?q=25+de+Mayo+138+-+4200+Santiago+del+Estero&output=embed",
  },
];

function appointmentStatus(status) {
  statusDot.classList.remove(
    "text-success",
    "text-primary",
    "text-blue",
    "text-danger"
  );
  cancelar_cita_El.innerHTML = "";

  if (status === "Cancelled") {
    statusDot.classList.add("text-danger");
    statusText.textContent = "Cancelado";
    console.log("This appointment is already cancelled. Redirecting...");

    cancelar_cita_El.style.display = "none";

    // Create the new "Agendar cita" button separately
    const scheduleBtn = document.createElement("button");
    scheduleBtn.className = "btn btn-primary";
    scheduleBtn.id = "schedule-btn";
    scheduleBtn.textContent = "Agenda tu cita";

    cancelar_cita_El.parentElement.appendChild(scheduleBtn);

    scheduleBtn.addEventListener("click", () => {
      console.log("Navigating to appointment scheduling page...");
      location.href = "../schedule_appointment/sched_appointment.html";
    });
  } else if (status === "Completed") {
    statusDot.classList.add("text-blue");
    statusText.textContent = "Completado";
    cancelar_cita_El.innerHTML = "";
    cancelar_cita_El.innerHTML =
      '<button class="btn btn-primary" id="schedule-btn">Agendar cita</button>';

    const scheduleBtn = document.getElementById("schedule-btn");
    scheduleBtn.addEventListener("click", () => {
      console.log("Navigating to appointment scheduling page...");
      location.href = "../schedule_appointment/sched_appointment.html";
    });
  } else if (status === "Pending") {
    statusDot.classList.add("text-success");
    statusText.textContent = "Pending";
    cancelar_cita_El.innerHTML =
      '<button class="btn btn-primary" id="cancel-btn">Cancela tu cita</button>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDonationsData();
});

// Get donations data:
const fetchDonationsData = async () => {
  try {
    const userID = localStorage.getItem("userID");

    if (!userID) {
      console.error("User ID not found in localStorage.");
      return;
    }

    const response = await fetch(`${config.API_URL}/users/${userID}/details`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch donations data: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("API Response:", data);

    donationsData = data.payload?.donations || [];

    lastDonationHospital =
      donationsData[donationsData.length - 1]?.institutionId?.name;
    nombre_hosp_ult_don_El.textContent = lastDonationHospital;

    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    if (donationsData.length > 0) {
      const lastDonation = donationsData[donationsData.length - 1];
      const donationDate = new Date(lastDonation.donationDate);

      const year = donationDate.getFullYear();
      const monthIndex = donationDate.getMonth();
      const month = monthNames[monthIndex];
      const day = String(donationDate.getDate()).padStart(2, "0");

      mes_ult_don_El.textContent = month;
      dia_ult_don_El.textContent = day;
      anio_ult_don_El.textContent = year;

      displayDonations(donationsData);
      renderPagination(donationsData);
    } else {
      document.getElementById("lastDonation-cont").innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center p-4 bg-secondary text-white rounded" style="min-height: 20vh;">
      <p class="mb-3 text-primary">"Aqui aparecera la informacion de tu ultima donacion una vez completes una."</p>
    </div>
      `;
      document.getElementById(
        "donations-container"
      ).innerHTML = `<p class="text-center">Aun no tienes donaciones</p>`;
    }

    if (lastDonationHospital) {
      const hospitalIndexDon = hospitales.findIndex(
        (hospital) => hospital.name === lastDonationHospital
      );
      mapFrameDonEl.src = hospitales[hospitalIndexDon].url;
      sitio_Web_Link_Don.href = hospitales[hospitalIndexDon].website;
      sitio_Web_Link_Don.target = "_blank";
    }

    const appointmentsData = data.payload?.appointments || [];

    if (appointmentsData.length > 0) {
      appointmentId = appointmentsData[appointmentsData.length - 1]._id;
      const nextAppointment = appointmentsData[appointmentsData.length - 1];

      // if (nextAppointment.status === "Pending") {

      const appointmentDate = new Date(nextAppointment.appointmentDate);
      const year_app = appointmentDate.getFullYear();
      const monthIndex = appointmentDate.getMonth();
      const month_app = monthNames[monthIndex];
      const day_app = String(appointmentDate.getDate()).padStart(2, "0");

      mes_prox_cita_El.textContent = month_app;
      dia_prox_cita_El.textContent = day_app;
      anio_prox_cita_El.textContent = year_app;

      cancelar_cita_El.disabled = false;
      cancelar_cita_El.style.display = "block";

      nextAppointmentHospital =
        appointmentsData[appointmentsData.length - 1]?.institutionId?.name;
      nombre_hosp_prox_cita_El.textContent = nextAppointmentHospital;

      const hospitalIndexCit = hospitales.findIndex(
        (hospital) => hospital.name === nextAppointmentHospital
      );
      mapFrameCitEl.src = hospitales[hospitalIndexCit].url;
      sitio_Web_Link_Cit.href = hospitales[hospitalIndexCit].website;
      sitio_Web_Link_Cit.target = "_blank";

      appointmentStatus(nextAppointment.status);
    } else if (appointmentsData.length === 0) {
      cita_content_El.innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center p-4 bg-secondary text-white rounded" style="min-height: 40vh;">
      <p class="mb-3 text-primary">"No tienes ninguna cita agendada"</p>
      <button class="btn btn-primary" onclick="window.location.href='../schedule_appointment/sched_appointment.html'">
      Agendar cita
      </button>

    </div>
  `;

      estado_El.classList.add("d-none");
    }
  } catch (error) {
    console.error("Error fetching donations data:", error);
  }
};

const displayDonations = (donations) => {
  const container = document.getElementById("donations-container");

  if (!container) {
    console.warn("Donations container not found.");
    return;
  }

  container.innerHTML = "";

  const start = (currentPage - 1) * donationsPerPage;
  const end = start + donationsPerPage;
  const paginatedDonations = donations.slice(start, end);

  paginatedDonations.forEach((donation, index) => {
    const { donationDate, institutionId } = donation;
    const formattedDate = new Date(donationDate).toLocaleDateString("es-ES");

    const row = `
      <tr>
        <td>${start + index + 1}</td>
        <td>${formattedDate}</td>
        <td>${institutionId.name}</td>
        <td class="d-none d-md-table-cell">${institutionId.address}</td>
      </tr>
    `;

    container.innerHTML += row;
  });
};

// Pagination:

const renderPagination = (donations) => {
  const paginationContainer = document.getElementById("pagination-container");

  if (!paginationContainer) {
    console.warn("Pagination container not found.");
    return;
  }

  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(donations.length / donationsPerPage);

  if (totalPages > 1) {
    const ul = document.createElement("ul");
    ul.className = "pagination justify-content-center";

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;

      li.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = i;
        displayDonations(donations);
        renderPagination(donations);
      });

      ul.appendChild(li);
    }

    paginationContainer.appendChild(ul);
  }
};

/*
cancelar_cita_El.addEventListener("click", async function () {
  if (!appointmentId) {
    console.error("No appointment ID found!");
    return;
  }

  try {
    const response = await fetch(
      `${config.API_URL}/appointments/${appointmentId}/cancel`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Appointment cancelled:", result);

    statusDot.classList.replace("text-success", "text-primary");
    statusText.textContent = "Cancelada";

    cancelar_cita_El.disabled = false;
  } catch (error) {
    console.error("Failed to cancel the appointment:", error);
  }

});

*/

if (document.referrer.includes("index.html")) {
  const successAlert = document.getElementById("success-alert");
  successAlert.classList.replace("d-none", "d-flex");

  setTimeout(() => {
    successAlert.classList.replace("d-flex", "d-none");
  }, 3000);
}

let userPoints = "";

fetch(`${config.API_URL}/users/${userID}`)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    const userPoints = data.payload.user.totalPoints;

    updateMedals(userPoints);
  })
  .catch((error) => console.error("Error fetching data:", error));

function updateMedals(points) {
  if (points >= 30) {
    medalOneEl.classList.remove("medal-locked");
    medalOneEl.classList.add("medal-unlocked");
  }
  if (points >= 120) {
    medalTwoEl.classList.remove("medal-locked");
    medalTwoEl.classList.add("medal-unlocked");
  }
  if (points >= 210) {
    medalThreeEl.classList.remove("medal-locked");
    medalThreeEl.classList.add("medal-unlocked");
  }
  if (points >= 300) {
    medalFourEl.classList.remove("medal-locked");
    medalFourEl.classList.add("medal-unlocked");
  }
  if (points >= 390) {
    medalFiveEl.classList.remove("medal-locked");
    medalFiveEl.classList.add("medal-unlocked");
  }
  if (points >= 420) {
    medalSixEl.classList.remove("medal-locked");
    medalSixEl.classList.add("medal-unlocked");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const cancelar_cita_El = document.getElementById("cancelar_cita");

  function appointmentStatus(status) {
    if (status === "Pending") {
      cancelar_cita_El.innerHTML = `
              <button id="cancel-btn">Cancela tu cita</button>
          `;
    } else {
      cancelar_cita_El.innerHTML = `
              <button id="schedule-btn" class="btn btn-primary">Agenda una cita</button>
          `;
    }
  }

  appointmentStatus("Pending");

  cancelar_cita_El.addEventListener("click", (event) => {
    if (event.target.id === "cancel-btn") {
      cita_cancelada_El.classList.remove("d-none");
      cita_cancelada_El.classList.add("d-block");
      cancelar_cita_El.classList.add("d-none");
      cita_cancelada_El.innerHTML = `
          <p>Esta seguro/a de cancelar su cita?</p>
          <div class="d-flex gap-1">
          <button id="cancelar-cita" class="btn btn-primary rounded-pill border-0 bg-primary text-white">Cancelar cita</button>
          <button id="conservar-cita" class="btn btn-primary rounded-pill border-0 bg-primary text-white">Conservar cita</button>
          </div>`;
      document.getElementById("cancelar-cita").addEventListener("click", () => {
        console.log("Cancelling appointment...");
        appointmentStatus("Cancelled");
        fetch(`${config.API_URL}/appointments/${appointmentId}/cancel`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        cita_cancelada_El.classList.remove("d-blok");
        cita_cancelada_El.classList.add("d-none");
        cancelar_cita_El.classList.remove("d-none");
        cancelar_cita_El.classList.add("d-block");
        statusDot.classList.add("text-danger");
        statusText.textContent = "Cancelada";
        cancelar_cita_El.innerHTML = `
                  <button class="btn btn-primary" id="schedule-btn">Agenda tu cita</button>`;
      });
      document
        .getElementById("conservar-cita")
        .addEventListener("click", () => {
          cita_cancelada_El.classList.remove("d-block");
          cita_cancelada_El.classList.add("d-none");
          cancelar_cita_El.classList.remove("d-none");
          cancelar_cita_El.classList.add("d-block");
          statusDot.classList.add("text-success");
          statusText.textContent = "Pending";
          cancelar_cita_El.innerHTML = `
            <button class="btn btn-primary" id="cancel-btn">Cancela tu cita</button>
          `;
        });
    } else if (event.target.id === "schedule-btn") {
      console.log("Navigating to appointment scheduling page...");
      location.href = "../schedule_appointment/sched_appointment.html";
    }
  });
});
