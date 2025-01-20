const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Avinash143@',
  database: 'schooldb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();
// Export a promisified pool


async function executeQuery(query, params = []) {
    try {
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

module.exports = {executeQuery}
