var registerForm = document.getElementById("registerForm");
var formMessage = document.getElementById("formMessage");

if (registerForm) {
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    formMessage.textContent = "Enviando inscripción...";
    formMessage.className = "form-message";

    var formData = new FormData(registerForm);

    var data = {
      nombre: formData.get("nombre"),
      apellido: formData.get("apellido"),
      email: formData.get("email"),
      fechaNacimiento: formData.get("fechaNacimiento"),
      dni: formData.get("dni"),
      telefono: formData.get("telefono"),
      domicilio: formData.get("domicilio"),
      contactoEmergencia: formData.get("contactoEmergencia"),
      telefonoEmergencia: formData.get("telefonoEmergencia")
    };

fetch("/api/registro", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
})
    .then(function (response) {
      return response.json().then(function (result) {
        return {
          ok: response.ok,
          result: result
        };
      });
    })
    .then(function (responseData) {
      var result = responseData.result;

      if (!responseData.ok) {
        formMessage.textContent = result.message || "No se pudo completar el registro.";
        formMessage.className = "form-message error";
        return;
      }

      formMessage.textContent = "Registro exitoso. Tu número de participante es " + result.numeroParticipante + ". Revisá tu mail.";
      formMessage.className = "form-message success";

      registerForm.reset();
    })
    .catch(function () {
      formMessage.textContent = "Error de conexión con el servidor.";
      formMessage.className = "form-message error";
    });
  });
}