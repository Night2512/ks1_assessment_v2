// netlify/functions/delete-submission.js
const { Pool } = require('pg');

let conn;

async function getDbConnection() {
  if (!conn) {
    conn = new Pool({
      connectionString: process.env.NETLIFY_DATABASE_URL, // Corrected env var
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

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { id } = JSON.parse(event.body);

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Submission ID is required.' }),
    };
  }

  try {
    const pool = await getDbConnection();
    // Deleting from the 'assessments' table
    const result = await pool.query('DELETE FROM assessments WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Submission not found.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Submission with ID ${id} deleted successfully.`, deletedId: id }),
    };
  } catch (error) {
    console.error(`Error deleting submission with ID ${id}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete submission.', error: error.message }),
    };
  } finally {
    // Note: client.end() is generally for single-use clients, for a pool it's less common per request
    // The pool manages connections, so we don't call client.end() here.
  }
};