const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = 5000;

const helmet = require('helmet');


app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL bağlantısı
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test veritabanı bağlantısı
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Database connection error');
  }
});

// Server başlat
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Tüm randevuları listeleme rotası
app.get('/api/randevular', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM randevular');
    res.json(result.rows); // Veritabanından dönen veriler
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
app.get('/api/doktorlar', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT kullanici_id AS id, adi, soyadi FROM kullanıcılar WHERE rol = $1',
      ['Doktor']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/hastalar', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT kullanici_id AS id, adi, soyadi FROM kullanıcılar WHERE rol = $1',
      ['Hasta']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/odalar', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, numarasi, durum FROM odalar');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
app.get('/api/randevudurumlari', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, durum_adi FROM randevudurumlari');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
app.post('/api/randevular', async (req, res) => {
  const { doktor_id, hasta_id, oda_id, durum_id, randevu_tarihi } = req.body;

  console.log("Gelen veri:", req.body); // Gelen veriyi kontrol edin

  if (!doktor_id || !hasta_id || !oda_id || !durum_id || !randevu_tarihi) {
    return res.status(400).json({ error: "Tüm alanlar doldurulmalıdır!" });
  }
  try {
    const randevu_id = uuidv4();
    const result = await pool.query(
      'INSERT INTO randevular (id, doktor_id, hasta_id, oda_id, durum_id, randevu_tarihi) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [randevu_id, doktor_id, hasta_id, oda_id, durum_id, randevu_tarihi]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Hata:", err.message);
    res.status(500).json({ error: 'Randevu eklenirken bir hata oluştu.' });
  }
});
app.delete('/api/randevular/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM randevular WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }

    res.status(200).json({ message: 'Randevu başarıyla silindi.', randevu: result.rows[0] });
  } catch (err) {
    console.error('Hata:', err.message);
    res.status(500).json({ error: 'Randevu silinirken bir hata oluştu.' });
  }
}); 
app.get('/api/doktor-bilgileri', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.kullanici_id,
        k.adi,
        k.soyadi,
        k.email,
        k.telefon,
        k.kayit_tarihi,
        d.klinik_id,
        klinikler.ad AS klinik_adi
      FROM
        kullanıcılar k
      INNER JOIN
        doktor d ON k.kullanici_id = d.kullanici_id
      INNER JOIN
        klinikler ON d.klinik_id = klinikler.id
      WHERE
        k.rol = 'Doktor'
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Hata:', err.message);
    res.status(500).json({ error: 'Doktor bilgileri alınırken bir hata oluştu.' });
  }
});
app.get('/api/hasta-bilgileri', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.kullanici_id,
        k.adi,
        k.soyadi,
        k.email,
        k.telefon,
        k.kayit_tarihi
      FROM
        kullanıcılar k
      WHERE
        k.rol = 'Hasta'
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Hata:', err.message);
    res.status(500).json({ error: 'Hasta bilgileri alınırken bir hata oluştu.' });
  }
});
// Belirli bir randevuyu getir
app.get('/api/randevular/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM randevular WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Hata:', err.message);
    res.status(500).json({ error: 'Randevu bilgisi alınırken bir hata oluştu.' });
  }
});
app.put('/api/randevular/:id', async (req, res) => {
  const { id } = req.params;
  const { doktor_id, hasta_id, oda_id, durum_id, randevu_tarihi } = req.body;

  try {
    const result = await pool.query(
      `UPDATE randevular
       SET doktor_id = $1, hasta_id = $2, oda_id = $3, durum_id = $4, randevu_tarihi = $5
       WHERE id = $6 RETURNING *`,
      [doktor_id, hasta_id, oda_id, durum_id, randevu_tarihi, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }

    res.status(200).json({ message: 'Randevu başarıyla güncellendi.', randevu: result.rows[0] });
  } catch (err) {
    console.error('Hata:', err.message);
    res.status(500).json({ error: 'Randevu güncellenirken bir hata oluştu.' });
  }
});
  
