// ============================
// 📦 IMPORTACIONES
// ============================
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ============================
// 🔧 CONFIGURACIÓN ORACLE
// ============================
const dbConfig = {
  user: "veterinaria",
  password: "admin",
  connectString: "localhost:1521/XEPDB1"
};

// ============================
// 🛠 FUNCIÓN GENÉRICA CONSULTAS
// ============================
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

// ============================
// 👤 CLIENTES
// ============================
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

// 🧾 CREAR CLIENTE + CITA
app.post('/clientes', async (req, res) => {
  console.log('🟢 Datos recibidos:', req.body);

  const { nombre, apellido, rut, telefono, email, nombre_mascota, raza, tipo_mascota, id_servicio, fecha_hora } = req.body;

  if (!nombre || !apellido || !rut || !nombre_mascota || !id_servicio || !fecha_hora) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {

    const existe = await executeQuery(
      'SELECT id_cliente FROM clientes WHERE rut = :rut',
      { rut }
    );

    let id_cliente;

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

    const fechaFormateada = fecha_hora.replace("T", " ").substring(0, 19);

    await executeQuery(
      `INSERT INTO citas (id_cliente, id_servicio, fecha_hora, estado)
       VALUES (:id_cliente, :id_servicio, TO_DATE(:fecha_hora, 'YYYY-MM-DD HH24:MI:SS'), 'pendiente')`,
      { id_cliente, id_servicio, fecha_hora: fechaFormateada },
      true
    );

    res.json({ message: '✅ Cita registrada correctamente', id_cliente });

  } catch (err) {
    console.error('❌ Error al registrar:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// ============================
// 🐾 SERVICIOS
// ============================
app.get('/servicios', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT id_servicio, nombre_servicio, descripcion 
       FROM servicios
       ORDER BY id_servicio`
    );
    res.json(result);
  } catch (err) {
    console.error('❌ Error al obtener servicios:', err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// ============================
// 📅 CITAS
// ============================
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
          c.id_servicio
       FROM citas c
       JOIN clientes cl ON c.id_cliente = cl.id_cliente
       JOIN servicios s ON c.id_servicio = s.id_servicio
       ORDER BY c.fecha_hora DESC`
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// ============================
// 🕒 HORAS OCUPADAS
// ============================
app.get('/citas/horas-ocupadas', async (req, res) => {
  let { fecha, id_servicio } = req.query;

  if (!fecha || !id_servicio) {
    return res.status(400).json({ error: '❌ Falta fecha o id_servicio' });
  }

  id_servicio = Number(id_servicio);
  if (isNaN(id_servicio)) {
    return res.status(400).json({ error: 'id_servicio debe ser numérico' });
  }

  try {
    const result = await executeQuery(
      `SELECT TO_CHAR(fecha_hora, 'HH24:MI') AS hora
       FROM citas
       WHERE TO_CHAR(fecha_hora, 'YYYY-MM-DD') = :fecha
       AND id_servicio = :id_servicio`,
      { fecha, id_servicio }
    );

    res.json({ ocupadas: result.map(r => r.HORA) });

  } catch (err) {
    console.error('❌ Error obteniendo horas ocupadas:', err);
    res.status(500).json({ error: 'Error al obtener horas ocupadas' });
  }
});

// ============================
// ✏️ EDITAR / CONFIRMAR CITA
// ============================
app.put('/citas/:id', async (req, res) => {
  const idNum = Number(req.params.id);
  const { fecha_hora, estado } = req.body;

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

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
    return res.status(400).json({ error: 'No se enviaron campos a actualizar' });
  }

  const query = `
    UPDATE citas
    SET ${setClauses.join(', ')}
    WHERE id_cita = :id
  `;

  try {
    await executeQuery(query, binds, true);
    res.json({ message: '✅ Cita actualizada correctamente' });

  } catch (err) {
    console.error('❌ Error al actualizar cita:', err);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// ============================
// 🔐 LOGIN ADMIN
// ============================
app.post('/api/admin/login', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const result = await executeQuery(
      `SELECT usuario, password FROM admin WHERE usuario = :usuario`,
      { usuario }
    );

    if (result.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const admin = result[0];

    if (password === admin.PASSWORD.trim()) {
      res.json({ message: 'Acceso permitido', usuario: admin.USUARIO });
    } else {
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }

  } catch (err) {
    console.error('❌ Error login:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ============================
// 🗑 ELIMINAR CITA
// ============================
app.delete('/citas/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await executeQuery(
      `DELETE FROM citas WHERE id_cita = :id`,
      { id: idNum },
      true
    );
    res.json({ message: '🗑 Cita eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar cita:', err);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});


// ============================
// ✏️ ACTUALIZAR POST DEL BLOG
// ============================
app.put('/blog/:id', async (req, res) => {
  const idNum = Number(req.params.id);
  const { titulo, contenido, imagen_url } = req.body;

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await executeQuery(
      `UPDATE blog 
       SET titulo = :titulo, contenido = :contenido, imagen_url = :imagen_url
       WHERE id_post = :id`,
      { id: idNum, titulo, contenido, imagen_url },
      true
    );

    res.json({ message: '✅ Post actualizado correctamente' });

  } catch (err) {
    console.error('❌ Error al actualizar post:', err);
    res.status(500).json({ error: 'Error al actualizar post' });
  }
});


// ============================
// 🗑️ ELIMINAR POST DEL BLOG
// ============================
app.delete('/blog/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await executeQuery(
      `DELETE FROM blog WHERE id_post = :id`,
      { id: idNum },
      true
    );

    res.json({ message: '🗑️ Post eliminado correctamente' });

  } catch (err) {
    console.error('❌ Error al eliminar post:', err);
    res.status(500).json({ error: 'Error al eliminar post' });
  }
});



// ============================
// 📰 BLOG - LISTA
// ============================
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
    console.error('❌ Error al obtener posts:', err);
    res.status(500).json({ error: 'Error al obtener posts' });
  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

// ============================
// 📄 OBTENER POST POR ID (CLOB SEGURO)
// ============================
app.get('/blog/:id', async (req, res) => {
  const idNum = Number(req.params.id);

  if (isNaN(idNum)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const result = await conn.execute(
      `SELECT id_post, titulo, contenido, TO_CHAR(fecha, 'DD/MM/YYYY HH24:MI'), imagen_url
       FROM blog
       WHERE id_post = :id`,
      { id: idNum }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const row = result.rows[0];

    // 🟦 LEER CLOB ANTES DE CERRAR LA CONEXIÓN
    let contenido = row[2];
    let texto = '';

    if (contenido && typeof contenido === 'object' && contenido.getData) {
      texto = await contenido.getData();  // ⬅ AQUÍ OCURRÍA EL ERROR
    } else if (typeof contenido === 'string') {
      texto = contenido;
    }

    const post = {
      id_post: row[0],
      titulo: row[1],
      contenido: texto,
      fecha: row[3],
      imagen_url: row[4]
    };

    res.json(post);

  } catch (err) {
    console.error('❌ Error obteniendo post:', err);
    res.status(500).json({ error: 'Error interno al obtener el post' });

  } finally {
    if (conn) try { await conn.close(); } catch {}
  }
});

// ============================
// 🚀 INICIAR SERVIDOR
// ============================
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);
