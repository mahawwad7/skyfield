const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = 'skyfield';

let db;
MongoClient.connect(MONGO_URI)
  .then(client => { db = client.db(DB_NAME); console.log('✅ MongoDB connected'); })
  .catch(err   => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ── GET ALL ───────────────────────────────────────────────────
app.get('/api/getAll', async (req, res) => {
  try {
    const [records, inventory, engineers, locations] = await Promise.all([
      db.collection('records').find().toArray(),
      db.collection('inventory').find().toArray(),
      db.collection('engineers').find().toArray(),
      db.collection('locations').find().toArray(),
    ]);
    res.json({
      records:   records.map(r => ({ ...r, _id: r._id.toString() })),
      inventory: inventory.map(d => ({ ...d, _id: d._id.toString() })),
      engineers: engineers.map(e => ({ ...e, _id: e._id.toString() })),
      locations: locations.map(l => l.name),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SAVE RECORD ───────────────────────────────────────────────
app.post('/api/saveRecord', async (req, res) => {
  try {
    const rec = req.body.record;
    if (typeof rec.devices === 'string') {
      try { rec.devices = JSON.parse(rec.devices); } catch { rec.devices = []; }
    }
    await db.collection('records').updateOne(
      { id: rec.id },
      { $set: rec },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE RECORD ─────────────────────────────────────────────
app.post('/api/deleteRecord', async (req, res) => {
  try {
    await db.collection('records').deleteOne({ id: req.body.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UPDATE INVENTORY ──────────────────────────────────────────
app.post('/api/updateInventory', async (req, res) => {
  try {
    const inv = req.body.inventory || [];
    await db.collection('inventory').deleteMany({});
    if (inv.length) await db.collection('inventory').insertMany(inv);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UPDATE ENGINEERS ──────────────────────────────────────────
app.post('/api/updateEngineers', async (req, res) => {
  try {
    const engs = req.body.engineers || [];
    await db.collection('engineers').deleteMany({});
    if (engs.length) await db.collection('engineers').insertMany(engs);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UPDATE LOCATIONS ──────────────────────────────────────────
app.post('/api/updateLocations', async (req, res) => {
  try {
    const locs = req.body.locations || [];
    await db.collection('locations').deleteMany({});
    if (locs.length) await db.collection('locations').insertMany(locs.map(l => ({ name: l })));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(process.env.PORT || 3000, () => console.log('🚀 Server running'));
