const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Oracle
const dbConfig = {
  user: "pucara",
  password: "pucara123",
  connectString: "192.168.0.107:1521/XEPDB1" // reemplaza TU_IP con tu IP
};

// Helper para ejecutar queries
async function executeQuery(query, binds = [], autoCommit = false) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(query, binds, { autoCommit });
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

/////////////////////////
// RUTAS CLIENTES
/////////////////////////

app.get('/clientes', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM clientes');
    res.json(result.rows);
  } catch {
    res.status(500).send('Error al obtener clientes');
  }
});

app.post('/clientes', async (req, res) => {
  const { nombre, apellido, telefono, email, direccion } = req.body;
  try {
    await executeQuery(
      `INSERT INTO clientes (nombre, apellido, telefono, email, direccion)
       VALUES (:nombre, :apellido, :telefono, :email, :direccion)`,
      [nombre, apellido, telefono, email, direccion],
      true
    );
    res.send('Cliente agregado');
  } catch {
    res.status(500).send('Error al agregar cliente');
  }
});

app.put('/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, telefono, email, direccion } = req.body;
  try {
    await executeQuery(
      `UPDATE clientes SET nombre=:nombre, apellido=:apellido, telefono=:telefono, email=:email, direccion=:direccion
       WHERE id_cliente=:id`,
      [nombre, apellido, telefono, email, direccion, id],
      true
    );
    res.send('Cliente actualizado');
  } catch {
    res.status(500).send('Error al actualizar cliente');
  }
});

app.delete('/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery('DELETE FROM clientes WHERE id_cliente=:id', [id], true);
    res.send('Cliente eliminado');
  } catch {
    res.status(500).send('Error al eliminar cliente');
  }
});

/////////////////////////
// RUTAS MASCOTAS
/////////////////////////

app.get('/mascotas', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM mascotas');
    res.json(result.rows);
  } catch {
    res.status(500).send('Error al obtener mascotas');
  }
});

app.post('/mascotas', async (req, res) => {
  const { nombre, especie, raza, edad, id_cliente } = req.body;
  try {
    await executeQuery(
      `INSERT INTO mascotas (nombre, especie, raza, edad, id_cliente)
       VALUES (:nombre, :especie, :raza, :edad, :id_cliente)`,
      [nombre, especie, raza, edad, id_cliente],
      true
    );
    res.send('Mascota agregada');
  } catch {
    res.status(500).send('Error al agregar mascota');
  }
});

app.put('/mascotas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, especie, raza, edad, id_cliente } = req.body;
  try {
    await executeQuery(
      `UPDATE mascotas SET nombre=:nombre, especie=:especie, raza=:raza, edad=:edad, id_cliente=:id_cliente
       WHERE id_mascota=:id`,
      [nombre, especie, raza, edad, id_cliente, id],
      true
    );
    res.send('Mascota actualizada');
  } catch {
    res.status(500).send('Error al actualizar mascota');
  }
});

app.delete('/mascotas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery('DELETE FROM mascotas WHERE id_mascota=:id', [id], true);
    res.send('Mascota eliminada');
  } catch {
    res.status(500).send('Error al eliminar mascota');
  }
});

/////////////////////////
// RUTAS PROFESIONALES
/////////////////////////

app.get('/profesionales', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM profesionales');
    res.json(result.rows);
  } catch {
    res.status(500).send('Error al obtener profesionales');
  }
});

app.post('/profesionales', async (req, res) => {
  const { nombre, apellido, especialidad, telefono, email } = req.body;
  try {
    await executeQuery(
      `INSERT INTO profesionales (nombre, apellido, especialidad, telefono, email)
       VALUES (:nombre, :apellido, :especialidad, :telefono, :email)`,
      [nombre, apellido, especialidad, telefono, email],
      true
    );
    res.send('Profesional agregado');
  } catch {
    res.status(500).send('Error al agregar profesional');
  }
});

app.put('/profesionales/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, especialidad, telefono, email } = req.body;
  try {
    await executeQuery(
      `UPDATE profesionales SET nombre=:nombre, apellido=:apellido, especialidad=:especialidad, telefono=:telefono, email=:email
       WHERE id_profesional=:id`,
      [nombre, apellido, especialidad, telefono, email, id],
      true
    );
    res.send('Profesional actualizado');
  } catch {
    res.status(500).send('Error al actualizar profesional');
  }
});

app.delete('/profesionales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery('DELETE FROM profesionales WHERE id_profesional=:id', [id], true);
    res.send('Profesional eliminado');
  } catch {
    res.status(500).send('Error al eliminar profesional');
  }
});

/////////////////////////
// RUTAS SERVICIOS
/////////////////////////

app.get('/servicios', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM servicios');
    res.json(result.rows);
  } catch {
    res.status(500).send('Error al obtener servicios');
  }
});

app.post('/servicios', async (req, res) => {
  const { nombre, descripcion, precio } = req.body;
  try {
    await executeQuery(
      `INSERT INTO servicios (nombre, descripcion, precio)
       VALUES (:nombre, :descripcion, :precio)`,
      [nombre, descripcion, precio],
      true
    );
    res.send('Servicio agregado');
  } catch {
    res.status(500).send('Error al agregar servicio');
  }
});

app.put('/servicios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio } = req.body;
  try {
    await executeQuery(
      `UPDATE servicios SET nombre=:nombre, descripcion=:descripcion, precio=:precio WHERE id_servicio=:id`,
      [nombre, descripcion, precio, id],
      true
    );
    res.send('Servicio actualizado');
  } catch {
    res.status(500).send('Error al actualizar servicio');
  }
});

app.delete('/servicios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery('DELETE FROM servicios WHERE id_servicio=:id', [id], true);
    res.send('Servicio eliminado');
  } catch {
    res.status(500).send('Error al eliminar servicio');
  }
});

/////////////////////////
// RUTAS CITAS
/////////////////////////

// LISTAR CITAS CON DETALLE
// ==========================
// 📌 RUTAS CITAS
// ==========================

// Obtener todas las citas
app.get('/citas', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT * FROM citas ORDER BY fecha_hora DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener citas:', err);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// Obtener una cita por ID
app.get('/citas/:id', async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT * FROM citas WHERE id_cita = :id`,
      { id: req.params.id }
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener cita:', err);
    res.status(500).json({ error: 'Error al obtener cita' });
  }
});

// Crear una nueva cita
app.post('/citas', async (req, res) => {
  try {
    const { id_cliente, id_mascota, fecha_hora,  estado, id_profesional, id_servicio } = req.body;

    const result = await executeQuery(
      `INSERT INTO citas (id_cliente, id_mascota, fecha_hora,  estado, id_profesional, id_servicio) 
       VALUES (:id_cliente, :id_mascota, :fecha,  :estado, :id_profesional, :id_servicio)`,
      {
        id_cliente,
        id_mascota,
        fecha: new Date(fecha_hora),  // 👈 Aquí lo pasamos como Date
        estado,
        id_profesional,
        id_servicio
      },
      true
    );

    res.status(201).json({ message: 'Cita creada correctamente' });
  } catch (err) {
    console.error('Error al crear cita:', err);
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

// Actualizar una cita
app.put('/citas/:id', async (req, res) => {
  try {
    const { id_cliente, id_mascota, fecha_hora, estado, id_profesional, id_servicio } = req.body;

    const result = await executeQuery(
      `UPDATE citas 
       SET id_cliente = :id_cliente,
           id_mascota = :id_mascota,
           fecha_hora = :fecha,
           estado = :estado
           id_profesional = :id_profesional
           id_servicio = :id_servicio
       WHERE id_cita = :id`,
      {
        id: req.params.id,
        id_cliente,
        id_mascota,
        fecha: new Date(fecha_hora),
        motivo,
        estado,
        id_profesional,
        id_servicio
      },
      true
    );

    res.json({ message: 'Cita actualizada correctamente' });
  } catch (err) {
    console.error('Error al actualizar cita:', err);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// Eliminar una cita
app.delete('/citas/:id', async (req, res) => {
  try {
    console.log("ID recibido desde frontend:", req.params.id); // 👈 debug

    const id = Number(req.params.id); // convierte a número
    if (isNaN(id)) {
      return res.status(400).json({ error: "El ID recibido no es válido" });
    }

    const result = await executeQuery(
      `DELETE FROM citas WHERE id_cita = :id`,
      { id },
      true  
    );

    res.json({ message: 'Cita eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar cita:', err);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});



/////////////////////////
// RUTAS ARTÍCULOS
/////////////////////////

app.get('/articulos', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM articulos');
    res.json(result.rows);
  } catch {
    res.status(500).send('Error al obtener artículos');
  }
});

app.post('/articulos', async (req, res) => {
  const { titulo, contenido, fecha } = req.body;
  try {
    await executeQuery(
      `INSERT INTO articulos (titulo, contenido, fecha) VALUES (:titulo, :contenido, :fecha)`,
      [titulo, contenido, fecha],
      true
    );
    res.send('Artículo agregado');
  } catch {
    res.status(500).send('Error al agregar artículo');
  }
});

/////////////////////////
// RUTAS CONTACTOS
/////////////////////////

app.post('/contactos', async (req, res) => {
  const { nombre, email, mensaje } = req.body;
  try {
    await executeQuery(
      `INSERT INTO contactos (nombre, email, mensaje) VALUES (:nombre, :email, :mensaje)`,
      [nombre, email, mensaje],
      true
    );
    res.send('Contacto recibido');
  } catch {
    res.status(500).send('Error al enviar contacto');
  }
});

/////////////////////////
// INICIAR SERVIDOR
/////////////////////////

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API de la Veterinaria funcionando 🚀");
});
