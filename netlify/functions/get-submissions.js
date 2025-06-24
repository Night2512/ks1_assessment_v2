const { Pool } = require('pg');

let conn;

async function getDbConnection() {
  if (!conn) {
    conn = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return conn;
}

exports.handler = async (event, context) => {
  // Basic Authentication
  const authHeader = event.headers.authorization;
  const expectedPassword = process.env.FRONTEND_PASSWORD;

  if (!authHeader || !expectedPassword || authHeader !== `Bearer ${expectedPassword}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const pool = await getDbConnection();
    // This query fetches all submissions, ordered by submission_time
    const result = await pool.query('SELECT * FROM assessments ORDER BY submission_time DESC'); 

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Error fetching all submissions:', error); // Changed log message
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch submissions.', error: error.message }),
    };
  }
};