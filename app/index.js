function inputValidation(event) {
  const input = event.target;
  const divMensajeError = document.querySelector(
    `div[data-input-error="${input.id}"]`
  );

  const errorMsgs = {
    inputName:
      "El nombre debe comenzar con mayuscula y NO contener caracteres especiales ni numeros",
    inputLastName:
      "El apellido debe comenzar con mayuscula y NO contener caracteres especiales ni numeros",
    inputEmail: "El correo no es válido",
    inputPassword:
      "Minimo 8 caracteres, al menos una letra mayuscula, una minuscula y un numero",
  };

  if (input.validity.valueMissing) {
    input.classList.add("is-invalid");
    divMensajeError.textContent = "Campo requerido";
  } else if (input.validity.patternMismatch) {
    input.classList.add("is-invalid");
    divMensajeError.textContent = errorMsgs[input.id]
      ? errorMsgs[input.id]
      : "Ingresa el contenido requerido";
  } else if (input.validity.typeMismatch) {
    input.classList.add("is-invalid");
    divMensajeError.textContent = "Ingresa el contenido requerido";
  } else if (input.validity.valid) {
    input.classList.remove("is-invalid");
  }
}

function diseasesToggle() {
  const select = document.getElementById("diseasesSelect");
  select.disabled = !select.disabled;
}

function removeDisease(event) {
  const diseaseNo = event.target;

  if (diseaseNo.checked) {
    document.getElementById("selectedDiseases").innerHTML = "";
  }
  diseasesToggle();
}


document.addEventListener("DOMContentLoaded", () => {
  const userID = localStorage.getItem("userID");
  console.log(userID);


  const loggedLinks = document.querySelectorAll(".logged");
  const notLoggedLinks = document.querySelectorAll(".not-logged");

  if (userID) {

    loggedLinks.forEach(link => {
      link.style.display = "block";  // or "inline-block" / "" depending on your layout
    });
    notLoggedLinks.forEach(link => {
      link.style.display = "none";
    });
  } else {

    loggedLinks.forEach(link => {
      link.style.display = "none";
    });
    notLoggedLinks.forEach(link => {
      link.style.display = "block";
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const logoutAlert = document.getElementById("logOut-alert");
  const logoutMessage = localStorage.getItem("logoutMessage");

  if (logoutAlert && logoutMessage) {
    logoutAlert.classList.remove("d-none");
    logoutAlert.classList.add("d-flex");

    localStorage.removeItem("logoutMessage");
  }
});