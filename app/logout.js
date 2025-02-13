document.addEventListener("DOMContentLoaded", function () {
  // Insert modal in body
  if (!document.getElementById("logoutModal")) {
    const modalHTML = `
      <div class="modal fade" id="logoutModal" tabindex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="logoutModalLabel">Cerrar Sesión</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              ¿Está seguro de que desea cerrar sesión?
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-danger" id="confirmLogout">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  const logoutBtnM = document.getElementById("logoutBtn_M");
  const logoutBtnD = document.getElementById("logoutBtn_D");

  function showLogoutModal() {
    const logoutModal = new bootstrap.Modal(document.getElementById("logoutModal"));
    logoutModal.show();
  }

  if (logoutBtnM) logoutBtnM.addEventListener("click", showLogoutModal);
  if (logoutBtnD) logoutBtnD.addEventListener("click", showLogoutModal);

  document.getElementById("confirmLogout").addEventListener("click", function () {
    logout();
  });
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userID");

  localStorage.setItem("logoutMessage", "Has cerrado sesión exitosamente.");

  window.location.href = `${window.location.origin}/app/index.html`;
}
