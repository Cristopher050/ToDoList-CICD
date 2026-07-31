const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://user:password@postgres:5432/tododb',
});

// Crear tabla
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        priority VARCHAR(20) DEFAULT 'Baja',
        status VARCHAR(20) DEFAULT 'Pendiente',
        completed BOOLEAN DEFAULT false
      );
    `);

    // Agregar columnas si la tabla ya existía
    await pool.query(`
      ALTER TABLE todos
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Baja';
    `);

    await pool.query(`
      ALTER TABLE todos
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pendiente';
    `);

    console.log("Base de datos lista.");
  } catch (err) {
    console.error(err);
  }
};

initDb();


// Obtener tareas
app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM todos ORDER BY id ASC'
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Crear tarea
app.post('/api/todos', async (req, res) => {

  try {

    const {
      title,
      priority,
      status,
      completed
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO todos
      (title,priority,status,completed)
      VALUES($1,$2,$3,$4)
      RETURNING *`,
      [
        title,
        priority,
        status,
        completed
      ]
    );

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// ENTREGAR TAREA
app.put('/api/todos/:id', async (req, res) => {

  try {

    const { id } = req.params;

    const {
      title,
      priority,
      status,
      completed
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE todos
      SET
      title=$1,
      priority=$2,
      status=$3,
      completed=$4
      WHERE id=$5
      RETURNING *`,
      [
        title,
        priority,
        status,
        completed,
        id
      ]
    );

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// Eliminar
app.delete('/api/todos/:id', async (req, res) => {

  try {

    await pool.query(
      'DELETE FROM todos WHERE id=$1',
      [req.params.id]
    );

    res.json({
      message: 'Eliminada'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en ${PORT}`);
});