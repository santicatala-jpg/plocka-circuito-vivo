const registerForm = document.getElementById("registerForm");
const formMessage = document.getElementById("formMessage");

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  formMessage.textContent = "Enviando inscripción...";
  formMessage.className = "form-message";

  const formData = new FormData(registerForm);

  const data = {
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

  try {
    const response = await fetch("http://localhost:3000/api/registro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      formMessage.textContent = result.message || "No se pudo completar el registro.";
      formMessage.className = "form-message error";
      return;
    }

    formMessage.textContent = `Registro exitoso. Tu número de participante es ${result.numeroParticipante}. Revisá tu mail.`;
    formMessage.className = "form-message success";

    registerForm.reset();

  } catch (error) {
    formMessage.textContent = "Error de conexión con el servidor.";
    formMessage.className = "form-message error";
  }
});// JavaScript Document