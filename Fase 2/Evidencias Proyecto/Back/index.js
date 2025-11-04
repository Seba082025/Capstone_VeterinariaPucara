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
    const result = await conn.execute(query, binds, { autoCommit });
    return result;
  } catch (err) {
    console.error("❌ Error ejecutando consulta:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

// ========================================
// ✅ OBTENER HORAS OCUPADAS
// ========================================
app.get('/citas/horas-ocupadas', async (req, res) => {
  const { fecha, id_servicio } = req.query;

  if (!fecha || !id_servicio) {
    return res.status(400).json({ error: '❌ Falta fecha o id_servicio' });
  }

  try {
    const query = `
      SELECT TO_CHAR(fecha_hora, 'HH24:MI') AS hora
      FROM citas
      WHERE TO_CHAR(fecha_hora, 'YYYY-MM-DD') = :fecha
      AND id_servicio = :id_servicio
    `;

    const result = await executeQuery(query, { fecha, id_servicio });
    const horas = result.rows.map(row => row[0]);

    return res.json({ ocupadas: horas });
  } catch (err) {
    console.error('❌ Error obteniendo horas ocupadas:', err);
    return res.status(500).json({ error: 'Error al obtener horas ocupadas' });
  }
});

// ============================
// 👤 CLIENTES
// ============================
app.get('/clientes', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM clientes ORDER BY id_cliente DESC');
    res.json(result.rows);
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
    // 1. Verificar si el cliente ya existe
    const existe = await executeQuery('SELECT id_cliente FROM clientes WHERE rut = :rut', { rut });
    let id_cliente;

    if (existe.rows.length > 0) {
      id_cliente = existe.rows[0][0];
      console.log('ℹ Cliente ya registrado con ID:', id_cliente);
    } else {
      const nuevoCliente = await executeQuery(
        `INSERT INTO clientes (nombre, apellido, rut, telefono, email, nombre_mascota, raza, tipo_mascota)
         VALUES (:nombre, :apellido, :rut, :telefono, :email, :nombre_mascota, :raza, :tipo_mascota)
         RETURNING id_cliente INTO :id_cliente`,
        {
          nombre, apellido, rut, telefono, email,
          nombre_mascota, raza, tipo_mascota,
          id_cliente: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        true
      );
      id_cliente = nuevoCliente.outBinds.id_cliente[0];
      console.log('✅ Nuevo cliente creado con ID:', id_cliente);
    }

    // 2. Inserción de la cita
    const fechaFormateada = fecha_hora.replace('T', ' ').substring(0, 19);
    await executeQuery(
      `INSERT INTO citas (id_cliente, id_servicio, fecha_hora, estado)
       VALUES (:id_cliente, :id_servicio, TO_DATE(:fecha_hora, 'YYYY-MM-DD HH24:MI:SS'), 'pendiente')`,
      { id_cliente, id_servicio, fecha_hora: fechaFormateada },
      true
    );

    res.json({ message: '✅ Cita registrada correctamente', id_cliente });
  } catch (err) {
    console.error('❌ Error al crear cliente/cita:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// ============================
// 📅 OBTENER TODAS LAS CITAS
// ============================
app.get('/citas', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT c.id_cita, c.fecha_hora, c.estado,
              cl.nombre, cl.apellido, cl.rut, cl.nombre_mascota,
              s.nombre_servicio
       FROM citas c
       JOIN clientes cl ON c.id_cliente = cl.id_cliente
       JOIN servicios s ON c.id_servicio = s.id_servicio
       ORDER BY c.fecha_hora DESC`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// ============================
// 🐾 SERVICIOS
// ============================
app.get('/servicios', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM servicios');
    const columns = result.metaData.map(col => col.name.toLowerCase());
    const servicios = result.rows.map(row => {
      const obj = {};
      row.forEach((value, i) => obj[columns[i]] = value);
      return obj;
    });
    res.json(servicios);
  } catch {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// ============================
// 🟢 TEST API
// ============================
app.get('/', (req, res) => {
  res.send('🚀 API funcionando correctamente');
});

// ============================
// 🚀 INICIAR SERVIDOR
// ============================
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
