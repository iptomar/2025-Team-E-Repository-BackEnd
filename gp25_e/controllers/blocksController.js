const db = require('../models/db');

// Get all blocks that overlap within an interval
exports.getOverlappingBlocks = async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end ) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }

  try {
    const [blocks] = await db.query(`
      SELECT *
      FROM Block
      WHERE  
        StartHour < ? AND 
        EndHour > ?
    `, [end, start]);

    res.json(blocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};