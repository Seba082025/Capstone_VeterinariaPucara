// ======================================================================
// 📦 IMPORTACIONES
// ======================================================================
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ===================
// ✉️ CONFIG EMAIL
// ===================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "naxololaso@gmail.com",  // ← tu correo
    pass: "mcdsaxnupaveufph"       // ← contraseña de aplicación
  }
});

// Función para enviar correos
async function enviarCorreoReserva(data) {
  const { email, nombre, apellido, fecha_hora, servicio, profesional } = data;

  const html = `
    <h2>¡Reserva Creada con exito, ${nombre} ${apellido}!</h2>
    <p><strong>Servicio:</strong> ${servicio}</p>
    <p><strong>Profesional:</strong> ${profesional}</p>
    <p><strong>Fecha y hora:</strong> ${fecha_hora}</p>

    <br>
    <p>Gracias por reservar en <strong>Clínica Veterinaria Pucará</strong> 🐶🐱</p>
  `;

  try {
    await transporter.sendMail({
      from: '"Clínica Veterinaria Pucará" <TU_CORREO@gmail.com>',
      to: email,
      subject: "Detalles de tu reserva",
      html
    });

    console.log("📩 Correo enviado correctamente a:", email);

  } catch (err) {
    console.error("❌ Error enviando correo:", err);
  }
}



// ======================================================================
// 🔧 CONFIGURACIÓN ORACLE
// ======================================================================
const dbConfig = {
  user: "veterinaria",
  password: "admin",
  connectString: "localhost:1521/XEPDB1"
};

// ======================================================================
// 🛠 FUNCIÓN GENÉRICA PARA CONSULTAS
// ======================================================================
async function executeQuery(query, binds = {}, autoCommit = false) {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(query, binds, {
      autoCommit,
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    return result.rows || [];
  } catch (err) {
    console.error("❌ Error ejecutando consulta:", err);
    throw err;
  } finally {
    if (conn) await conn.close();
  }
}

// ======================================================================
// 👤 CLIENTES
// ======================================================================

// Obtener todos los clientes
app.get('/clientes', async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM clientes ORDER BY id_cliente DESC'
    );
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/clientes', async (req, res) => {
  console.log('🟢 Datos recibidos:', req.body);

  const {
    nombre,
    apellido,
    rut,
    telefono,
    email,
    nombre_mascota,
    raza,
    tipo_mascota,
    id_servicio,
    fecha_hora,
    id_profesional
  } = req.body;

  if (!nombre || !apellido || !rut || !nombre_mascota || !id_servicio || !fecha_hora) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // 1️⃣ Buscar si ya existe cliente por RUT
    const existe = await executeQuery(
      'SELECT id_cliente FROM clientes WHERE rut = :rut',
      { rut }
    );

    let id_cliente;

    // 2️⃣ Crear o recuperar cliente
    if (existe.length > 0) {
      id_cliente = existe[0].ID_CLIENTE;
    } else {
      const conn = await oracledb.getConnection(dbConfig);
      const result = await conn.execute(
        `INSERT INTO clientes (nombre, apellido, rut, telefono, email, nombre_mascota, raza, tipo_mascota)
         VALUES (:nombre, :apellido, :rut, :telefono, :email, :nombre_mascota, :raza, :tipo_mascota)
         RETURNING id_cliente INTO :id_cliente`,
        {
          nombre, apellido, rut, telefono, email,
          nombre_mascota, raza, tipo_mascota,
          id_cliente: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        { autoCommit: true }
      );

      id_cliente = result.outBinds.id_cliente[0];
      await conn.close();
    }

    // 3️⃣ Insertar CITA con profesional
    const fechaFormateada = fecha_hora.replace("T", " ").substring(0, 19);

    await executeQuery(
      `INSERT INTO citas (
        id_cliente,
        id_servicio,
        id_profesional,
        fecha_hora,
        estado
      )
      VALUES (
        :id_cliente,
        :id_servicio,
        :id_profesional,
        TO_DATE(:fecha_hora, 'YYYY-MM-DD HH24:MI:SS'),
        'pendiente'
      )`,
      {
        id_cliente,
        id_servicio,
        id_profesional,
        fecha_hora: fechaFormateada
      },
      true
    );

    // 4️⃣ Obtener info del servicio y profesional para el correo
    const servicioData = await executeQuery(
      `SELECT nombre_servicio FROM servicios WHERE id_servicio = :id`,
      { id: id_servicio }
    );

    const profesionalData = await executeQuery(
      `SELECT nombre, apellido FROM profesionales WHERE id_profesional = :id`,
      { id: id_profesional }
    );

    const nombreServicio = servicioData[0].NOMBRE_SERVICIO;
    const nombreProfesional =
      profesionalData.length > 0
        ? `${profesionalData[0].NOMBRE} ${profesionalData[0].APELLIDO}`
        : "No asignado";

    // 5️⃣ Enviar correo
    enviarCorreoReserva({
      email,
      nombre,
      apellido,
      fecha_hora: fechaFormateada,
      servicio: nombreServicio,
      profesional: nombreProfesional
    });

    res.json({ message: '✅ Cita registrada correctamente y correo enviado', id_cliente });

  } catch (err) {
    console.error('❌ Error al registrar cliente + cita:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// ======================================================================
// 🐾 SERVICIOS
// ======================================================================
app.get('/servicios', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT id_servicio, nombre_servicio, descripcion, duracion_minutos, precio
       FROM servicios ORDER BY id_servicio`
    );
    res.json(result);
  } catch (err) {
    console.error('❌ Error servicios:', err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// ======================================================================
// 👨‍⚕️ PROFESIONALES
// ======================================================================

// Listar todos los profesionales
app.get('/profesionales', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT p.id_profesional,
              p.nombre,
              p.apellido,
              p.telefono,
              p.email,
              p.activo,
              p.id_servicio,
              s.nombre_servicio
       FROM profesionales p
       JOIN servicios s ON p.id_servicio = s.id_servicio
       ORDER BY p.id_profesional`
    );
    res.json(result);
  } catch (err) {
    console.error('❌ Error profesionales:', err);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
});

// Profesionales por servicio
app.get('/profesionales/servicio/:idServicio', async (req, res) => {
  const idServicio = Number(req.params.idServicio);

  if (isNaN(idServicio)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const result = await executeQuery(
      `SELECT id_profesional, nombre, apellido, telefono, email, activo, id_servicio
       FROM profesionales
       WHERE id_servicio = :id
       ORDER BY nombre, apellido`,
      { id: idServicio }
    );
    res.json(result);
  } catch (err) {
    console.error('❌ Error profesionales por servicio:', err);
    res.status(500).json({ error: 'Error al obtener profesionales' });
  }
});

// Crear profesional
app.post('/profesionales', async (req, res) => {
  const { nombre, apellido, id_servicio, telefono, email, activo } = req.body;

  if (!nombre || !apellido || !id_servicio) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    await executeQuery(
      `INSERT INTO profesionales (nombre, apellido, id_servicio, telefono, email, activo)
       VALUES (:nombre, :apellido, :id_servicio, :telefono, :email, NVL(:activo, 'S'))`,
      { nombre, apellido, id_servicio, telefono, email, activo },
      true
    );
    res.json({ message: '✅ Profesional creado' });

  } catch (err) {
    console.error('❌ Error crear profesional:', err);
    res.status(500).json({ error: 'Error al crear profesional' });
  }
});

// Editar profesional
app.put('/profesionales/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

  const { nombre, apellido, id_servicio, telefono, email, activo } = req.body;

  try {
    await executeQuery(
      `UPDATE profesionales SET
          nombre = :nombre,
          apellido = :apellido,
          id_servicio = :id_servicio,
          telefono = :telefono,
          email = :email,
          activo = :activo
       WHERE id_profesional = :id`,
      { id: idNum, nombre, apellido, id_servicio, telefono, email, activo },
      true
    );
    res.json({ message: '✅ Profesional actualizado' });

  } catch (err) {
    console.error('❌ Error actualizar profesional:', err);
    res.status(500).json({ error: 'Error al actualizar profesional' });
  }
});

// Eliminar profesional
app.delete('/profesionales/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await executeQuery(
      `DELETE FROM profesionales WHERE id_profesional = :id`,
      { id: idNum },
      true
    );
    res.json({ message: '🗑 Profesional eliminado' });

  } catch (err) {
    console.error('❌ Error eliminar profesional:', err);
    res.status(500).json({ error: 'Error al eliminar profesional' });
  }
});

// ============================
// 👨‍⚕️ PROFESIONALES DISPONIBLES POR FECHA Y SERVICIO
// ============================
app.get('/profesionales/disponibles', async (req, res) => {
  const { fecha_hora, id_servicio } = req.query;

  if (!fecha_hora || !id_servicio) {
    return res.status(400).json({ error: 'Falta fecha_hora o id_servicio' });
  }

  try {
    const result = await executeQuery(
      `
      SELECT p.id_profesional, p.nombre, p.apellido
      FROM profesionales p
      WHERE p.id_servicio = :id_servicio
      AND p.id_profesional NOT IN (
          SELECT id_profesional
          FROM citas
          WHERE TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI') = :fecha_hora
      )
      ORDER BY p.nombre
      `,
      { fecha_hora, id_servicio }
    );

    res.json(result);

  } catch (err) {
    console.error("❌ Error obteniendo profesionales disponibles:", err);
    res.status(500).json({ error: 'Error al obtener profesionales disponibles' });
  }
});


// ======================================================================
// 📅 CITAS
// ======================================================================

// Obtener citas con profesional incluido
app.get('/citas', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT 
          c.id_cita,
          c.fecha_hora,
          c.estado,
          cl.nombre,
          cl.apellido,
          cl.rut,
          cl.telefono,
          cl.nombre_mascota,
          s.nombre_servicio,
          c.id_servicio,
          p.nombre AS nombre_profesional,
          p.apellido AS apellido_profesional,
          c.id_profesional
       FROM citas c
       JOIN clientes cl ON c.id_cliente = cl.id_cliente
       JOIN servicios s ON c.id_servicio = s.id_servicio
       LEFT JOIN profesionales p ON p.id_profesional = c.id_profesional
       ORDER BY c.fecha_hora DESC`
    );

    res.json(result);

  } catch (err) {
    console.error('❌ Error citas:', err);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// ============================
// 👨‍⚕️ PROFESIONALES DISPONIBLES SEGÚN FECHA + HORA
// ============================
app.get('/profesionales-disponibles', async (req, res) => {
  const { id_servicio, fecha, hora } = req.query;

  if (!id_servicio || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    const result = await executeQuery(
      `
      SELECT p.id_profesional, p.nombre, p.apellido, p.telefono, p.email, p.activo
      FROM profesionales p
      WHERE p.id_servicio = :id_servicio
        AND p.id_profesional NOT IN (
          SELECT c.id_profesional
          FROM citas c
          WHERE TO_CHAR(c.fecha_hora, 'YYYY-MM-DD') = :fecha
            AND TO_CHAR(c.fecha_hora, 'HH24:MI') = :hora
        )
      ORDER BY p.nombre
      `,
      { id_servicio, fecha, hora }
    );

    res.json(result);

  } catch (err) {
    console.error("❌ Error profesionales disponibles:", err);
    res.status(500).json({ error: "Error obteniendo profesionales disponibles" });
  }
});


// ===============================
// 🕒 HORAS OCUPADAS (validado correctamente)
// ===============================
app.get('/citas/horas-ocupadas', async (req, res) => {
  const { fecha, id_servicio } = req.query;

  if (!fecha || !id_servicio) {
    return res.status(400).json({ error: 'Falta fecha o servicio' });
  }

  try {
    // Total profesionales del servicio
    const totalProfQuery = await executeQuery(
      `SELECT COUNT(*) AS TOTAL FROM profesionales WHERE id_servicio = :id`,
      { id: Number(id_servicio) }
    );

    const totalProfesionales = totalProfQuery[0].TOTAL;

    // Horas ocupadas
    const ocupadosQuery = await executeQuery(
      `SELECT
          TO_CHAR(fecha_hora, 'HH24:MI') AS HORA,
          COUNT(*) AS OCUPADOS
       FROM citas
       WHERE TO_CHAR(fecha_hora, 'YYYY-MM-DD') = :fecha
         AND id_servicio = :id
       GROUP BY TO_CHAR(fecha_hora, 'HH24:MI')`,
      { fecha, id: Number(id_servicio) }
    );

    // Horas donde TODOS están ocupados
    const horasBloqueadas = ocupadosQuery
      .filter(r => r.OCUPADOS >= totalProfesionales)
      .map(r => r.HORA);

    res.json({ ocupadas: horasBloqueadas });

  } catch (err) {
    console.error('❌ Error horas ocupadas:', err);
    res.status(500).json({ error: 'Error obteniendo horas ocupadas' });
  }
});




// Editar cita
app.put('/citas/:id', async (req, res) => {
  const idNum = Number(req.params.id);
  const { fecha_hora, estado } = req.body;

  if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

  let setClauses = [];
  let binds = { id: idNum };

  if (fecha_hora) {
    const fechaSQL = fecha_hora.replace("T", " ").substring(0, 19);
    setClauses.push("fecha_hora = TO_DATE(:fecha_hora, 'YYYY-MM-DD HH24:MI:SS')");
    binds.fecha_hora = fechaSQL;
  }

  if (estado) {
    setClauses.push("estado = :estado");
    binds.estado = estado;
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'No hay campos a actualizar' });
  }

  try {
    await executeQuery(
      `UPDATE citas SET ${setClauses.join(', ')} WHERE id_cita = :id`,
      binds,
      true
    );
    res.json({ message: '✅ Cita actualizada' });

  } catch (err) {
    console.error('❌ Error actualizar cita:', err);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// Eliminar cita
app.delete('/citas/:id', async (req, res) => {
  const idNum = Number(req.params.id);
  if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await executeQuery(
      `DELETE FROM citas WHERE id_cita = :id`,
      { id: idNum },
      true
    );
    res.json({ message: '🗑 Cita eliminada' });

  } catch (err) {
    console.error('❌ Error eliminar cita:', err);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});

// ======================================================================
// 🔐 LOGIN ADMIN
// ======================================================================
app.post('/api/admin/login', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const result = await executeQuery(
      `SELECT usuario, password FROM admin WHERE usuario = :usuario`,
      { usuario }
    );

    if (result.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    const admin = result[0];

    if (password === admin.PASSWORD.trim()) {
      return res.json({ message: 'Acceso permitido', usuario: admin.USUARIO });
    }

    return res.status(401).json({ error: 'Contraseña incorrecta' });

  } catch (err) {
    console.error('❌ Error login admin:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ======================================================================
// 📰 BLOG
// ======================================================================

// Obtener lista de posts
app.get('/blog', async (req, res) => {
  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT id_post, titulo, contenido, TO_CHAR(fecha, 'DD/MM/YYYY'), imagen_url
       FROM blog
       ORDER BY fecha DESC`
    );

    const posts = await Promise.all(
      result.rows.map(async (row) => {

        let contenido = row[2];
        let texto = '';

        if (contenido && typeof contenido === 'object' && contenido.getData) {
          texto = await contenido.getData();
        } else if (typeof contenido === 'string') {
          texto = contenido;
        }

        return {
          id_post: row[0],
          titulo: row[1],
          contenido: texto,
          fecha: row[3],
          imagen_url: row[4]
        };
      })
    );

    res.json(posts);

  } catch (err) {
    console.error('❌ Error blog lista:', err);
    res.status(500).json({ error: 'Error al obtener posts' });

  } finally {
    if (conn) try { conn.close(); } catch {}
  }
});

// Obtener post por ID
app.get('/blog/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT id_post, titulo, contenido, TO_CHAR(fecha, 'DD/MM/YYYY HH24:MI'), imagen_url
       FROM blog
       WHERE id_post = :id`,
      { id: idNum }
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Post no encontrado' });

    const row = result.rows[0];
    let contenido = row[2];
    let texto = '';

    if (contenido && typeof contenido === 'object' && contenido.getData) {
      texto = await contenido.getData();
    } else if (typeof contenido === 'string') {
      texto = contenido;
    }

    res.json({
      id_post: row[0],
      titulo: row[1],
      contenido: texto,
      fecha: row[3],
      imagen_url: row[4]
    });

  } catch (err) {
    console.error('❌ Error obtener post ID:', err);
    res.status(500).json({ error: 'Error interno' });

  } finally {
    if (conn) try { conn.close(); } catch {}
  }
});

// ======================================================
// 📝 BLOG — CREAR UN POST
// ======================================================
app.post('/blog', async (req, res) => {
  const { titulo, contenido, imagen_url } = req.body;

  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `INSERT INTO blog (titulo, contenido, fecha, imagen_url)
       VALUES (:titulo, :contenido, SYSDATE, :imagen_url)
       RETURNING id_post INTO :id`,
      {
        titulo,
        contenido,
        imagen_url,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    res.json({ message: 'Post creado', id_post: result.outBinds.id[0] });

  } catch (err) {
    console.error('❌ Error al crear post:', err);
    res.status(500).json({ error: 'Error al crear post' });

  } finally {
    if (conn) try { conn.close(); } catch {}
  }
});


// ======================================================
// ✏️ BLOG — ACTUALIZAR POST
// ======================================================
app.put('/blog/:id', async (req, res) => {
  const idNum = Number(req.params.id);
  const { titulo, contenido, imagen_url } = req.body;

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `UPDATE blog 
       SET titulo = :titulo,
           contenido = :contenido,
           imagen_url = :imagen_url
       WHERE id_post = :id`,
      { titulo, contenido, imagen_url, id: idNum },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json({ message: 'Post actualizado' });

  } catch (err) {
    console.error('❌ Error al actualizar post:', err);
    res.status(500).json({ error: 'Error al actualizar post' });

  } finally {
    if (conn) try { conn.close(); } catch {}
  }
});


// ======================================================
// 🗑 BLOG — ELIMINAR POST
// ======================================================
app.delete('/blog/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  let conn;

  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `DELETE FROM blog WHERE id_post = :id`,
      { id: idNum },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json({ message: 'Post eliminado' });

  } catch (err) {
    console.error('❌ Error al eliminar post:', err);
    res.status(500).json({ error: 'Error al eliminar post' });

  } finally {
    if (conn) try { conn.close(); } catch {}
  }
});

// Servicios

app.post('/servicios', async (req, res) => {
  const { nombre_servicio, descripcion, precio, duracion_minutos } = req.body;

  try {
    await executeQuery(`
      INSERT INTO servicios (nombre_servicio, descripcion, precio, duracion_minutos)
      VALUES (:nombre_servicio, :descripcion, :precio, :duracion_minutos)
    `, {
      nombre_servicio,
      descripcion,
      precio,
      duracion_minutos
    }, true);

    res.json({ ok: true, message: 'Servicio creado correctamente' });

  } catch (err) {
    res.status(500).json({ error: 'Error al crear servicio', err });
  }
});


app.put('/servicios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_servicio, descripcion, precio, duracion_minutos } = req.body;

  try {
    await executeQuery(`
      UPDATE servicios
      SET nombre_servicio = :nombre_servicio,
          descripcion = :descripcion,
          precio = :precio,
          duracion_minutos = :duracion_minutos
      WHERE id_servicio = :id
    `, {
      id,
      nombre_servicio,
      descripcion,
      precio,
      duracion_minutos
    }, true);

    res.json({ ok: true, message: 'Servicio actualizado correctamente' });

  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar servicio', err });
  }
});


app.delete('/servicios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await executeQuery(`
      DELETE FROM servicios WHERE id_servicio = :id
    `, { id }, true);

    res.json({ ok: true, message: 'Servicio eliminado correctamente' });

  } catch (err) {
    if (err.errorNum === 2292) {
      return res.status(400).json({
        error: 'No se puede eliminar: el servicio tiene citas asociadas'
      });
    }

    res.status(500).json({ error: 'Error al eliminar servicio', err });
  }
});





// ======================================================================
// 🚀 INICIAR SERVIDOR
// ======================================================================
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`)
);
