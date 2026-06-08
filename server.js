/* eslint-env node */

var express = require("express");
var cors = require("cors");
var path = require("path");
var nodemailer = require("nodemailer");
var dotenv = require("dotenv");
var createClient = require("@supabase/supabase-js").createClient;

dotenv.config();

var app = express();
var PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

var supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function completarCeros(numero, largo) {
  var texto = String(numero);

  while (texto.length < largo) {
    texto = "0" + texto;
  }

  return texto;
}

function generarNumeroParticipante(id) {
  return "PLK" + completarCeros(id, 4);
}

function limpiarTexto(texto) {
  if (!texto) {
    return "";
  }

  return String(texto).trim();
}

function normalizarEmail(email) {
  if (!email) {
    return "";
  }

  return String(email).toLowerCase().trim();
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function crearTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
}

function obtenerEmailFrom() {
  if (!process.env.EMAIL_USER) {
    return process.env.EMAIL_FROM || "Plocka Circuito Vivo";
  }

  if (process.env.EMAIL_FROM) {
    return '"' + process.env.EMAIL_FROM + '" <' + process.env.EMAIL_USER + ">";
  }

  return '"Plocka Circuito Vivo" <' + process.env.EMAIL_USER + ">";
}

function crearHtmlMail(nombre, numeroParticipante) {
  var nombreSeguro = escaparHtml(nombre);
  var numeroSeguro = escaparHtml(numeroParticipante);

  return (
    '<div style="font-family: Montserrat, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 40px 24px; color: #111111;">' +

      '<div style="text-align: center; margin-bottom: 24px;">' +
        '<h1 style="color: #0c4f43; margin: 0; font-size: 34px;">Plocka</h1>' +
        '<p style="letter-spacing: 5px; margin: 0; color: #0c4f43;">circuito vivo</p>' +
      '</div>' +

      '<h2 style="text-align: center; font-size: 30px; font-weight: 500; margin-bottom: 32px;">¡Gracias por inscribirte, ' + nombreSeguro + '!</h2>' +

      '<p style="font-size: 16px; line-height: 1.6;">' +
        'Esta carrera promete ser transformadora. Con tu ayuda no solo vamos a divertirnos, sino que también vamos a contribuir al barrio y al ecosistema en general de nuestro país para que el pulmón verde del oeste se mantenga más verde que nunca.' +
      '</p>' +

      '<p style="font-size: 16px; line-height: 1.6;">' +
        'Desde Plocka lo que queremos es generar un hábito en la comunidad para que todos nos cuidemos y cuidemos nuestro suelo.' +
      '</p>' +

      '<div style="text-align: center; margin: 38px 0;">' +
        '<div style="display: inline-block; padding: 18px 42px; border-radius: 14px; background: linear-gradient(180deg, #0c5d4f 0%, #022b22 100%); color: white; box-shadow: 0 10px 22px rgba(0,0,0,0.25);">' +
          '<div style="font-size: 14px; opacity: 0.9; margin-bottom: 6px;">Número de participante</div>' +
          '<div style="font-size: 28px; font-weight: 700; letter-spacing: 2px;">' + numeroSeguro + '</div>' +
        '</div>' +
      '</div>' +

      '<p style="text-align: center; font-size: 17px; font-weight: 700;">' +
        'Te prometemos que vas a transpirar mucho y que la vas a pasar muy bien.<br>' +
        '¡Gracias por involucrarte y participar!' +
      '</p>' +

    '</div>'
  );
}

function enviarMailConfirmacion(participante, callback) {
  var transporter = crearTransporter();

  if (!transporter) {
    callback(null, "Mail no configurado.");
    return;
  }

  var mailOptions = {
    from: obtenerEmailFrom(),
    to: participante.email,
    subject: "Confirmación de inscripción | Plocka Circuito Vivo",
    html: crearHtmlMail(participante.nombre, participante.numeroParticipante)
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      callback(error);
      return;
    }

    callback(null, info);
  });
}

app.get("/api/health", function (req, res) {
  res.json({
    message: "Backend de Plocka funcionando correctamente."
  });
});

app.post("/api/registro", function (req, res) {
  if (!supabase) {
    return res.status(500).json({
      message: "La base de datos todavía no está configurada."
    });
  }

  var nombre = limpiarTexto(req.body.nombre);
  var apellido = limpiarTexto(req.body.apellido);
  var email = normalizarEmail(req.body.email);
  var fechaNacimiento = limpiarTexto(req.body.fechaNacimiento);
  var dni = limpiarTexto(req.body.dni);
  var telefono = limpiarTexto(req.body.telefono);
  var domicilio = limpiarTexto(req.body.domicilio);
  var contactoEmergencia = limpiarTexto(req.body.contactoEmergencia);
  var telefonoEmergencia = limpiarTexto(req.body.telefonoEmergencia);

  if (
    !nombre ||
    !apellido ||
    !email ||
    !fechaNacimiento ||
    !dni ||
    !telefono ||
    !domicilio ||
    !contactoEmergencia ||
    !telefonoEmergencia
  ) {
    return res.status(400).json({
      message: "Faltan datos obligatorios."
    });
  }

  supabase
    .from("participantes")
    .select("id, email")
    .eq("email", email)
    .maybeSingle()
    .then(function (respuestaEmail) {
      if (respuestaEmail.error) {
        return res.status(500).json({
          message: "Error al revisar el mail."
        });
      }

      if (respuestaEmail.data) {
        return res.status(409).json({
          message: "Este mail ya fue registrado."
        });
      }

      supabase
        .from("participantes")
        .select("id, dni")
        .eq("dni", dni)
        .maybeSingle()
        .then(function (respuestaDni) {
          if (respuestaDni.error) {
            return res.status(500).json({
              message: "Error al revisar el DNI."
            });
          }

          if (respuestaDni.data) {
            return res.status(409).json({
              message: "Este DNI ya fue registrado."
            });
          }

          supabase
            .from("participantes")
            .insert([
              {
                nombre: nombre,
                apellido: apellido,
                email: email,
                fecha_nacimiento: fechaNacimiento,
                dni: dni,
                telefono: telefono,
                domicilio: domicilio,
                contacto_emergencia: contactoEmergencia,
                telefono_emergencia: telefonoEmergencia,
                acepto_terminos: true
              }
            ])
            .select("id, nombre, apellido, email")
            .single()
            .then(function (respuestaInsert) {
              if (respuestaInsert.error) {
                return res.status(500).json({
                  message: "No se pudo guardar la inscripción."
                });
              }

              var participanteGuardado = respuestaInsert.data;
              var numeroParticipante = generarNumeroParticipante(participanteGuardado.id);

              supabase
                .from("participantes")
                .update({
                  numero_participante: numeroParticipante
                })
                .eq("id", participanteGuardado.id)
                .then(function (respuestaUpdate) {
                  if (respuestaUpdate.error) {
                    return res.status(500).json({
                      message: "No se pudo generar el número de participante."
                    });
                  }

                  var participante = {
                    nombre: nombre,
                    apellido: apellido,
                    email: email,
                    numeroParticipante: numeroParticipante
                  };

                  res.status(201).json({
                    message: "Registro exitoso. Revisá tu mail.",
                    numeroParticipante: numeroParticipante
                  });

                  enviarMailConfirmacion(participante, function (errorMail, infoMail) {
                    if (errorMail) {
                      console.log("Error al enviar mail:", errorMail.message);
                      return;
                    }

                    if (infoMail === "Mail no configurado.") {
                      console.log("Registro guardado. Mail no configurado.");
                      return;
                    }

                    console.log("Mail enviado correctamente a " + participante.email);
                  });
                });
            });
        });
    })
    .catch(function (error) {
      console.log("Error inesperado en registro:", error.message);

      if (res.headersSent) {
        return;
      }

      return res.status(500).json({
        message: "Error inesperado al procesar la inscripción."
      });
    });
});

app.get("/api/participantes", function (req, res) {
  if (!supabase) {
    return res.status(500).json({
      message: "La base de datos todavía no está configurada."
    });
  }

  if (!process.env.ADMIN_TOKEN || req.query.token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      message: "No autorizado."
    });
  }

  supabase
    .from("participantes")
    .select("id, numero_participante, nombre, apellido, email, dni, telefono, domicilio, fecha_registro")
    .order("id", { ascending: false })
    .then(function (respuesta) {
      if (respuesta.error) {
        return res.status(500).json({
          message: "No se pudieron obtener los participantes."
        });
      }

      res.json(respuesta.data);
    });
});

app.use(function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, function () {
  console.log("Servidor corriendo en http://localhost:" + PORT);
});