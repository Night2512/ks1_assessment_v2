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

  // Get submission ID from query parameters
  const submissionId = event.queryStringParameters.id;

  if (!submissionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Submission ID is required.' }),
    };
  }

  try {
    const pool = await getDbConnection();
    const result = await pool.query(
      'SELECT detailed_results FROM assessments WHERE id = $1',
      [parseInt(submissionId)]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Submission details not found.' }),
      };
    }

    let detailedResults = result.rows[0].detailed_results;

    // --- FIX: Explicitly parse detailedResults if it's a string (common for JSONB from DB) ---
    if (typeof detailedResults === 'string') {
        try {
            detailedResults = JSON.parse(detailedResults);
        } catch (e) {
            console.error("Failed to parse detailedResults string as JSON:", e);
            // If it fails to parse, return an empty array or an error state to the frontend
            detailedResults = []; // Fallback to an empty array for graceful handling
        }
    }
    // --- END FIX ---

    return {
      statusCode: 200,
      body: JSON.stringify(detailedResults), // Send the JSON object/array
    };
  } catch (error) {
    console.error(`Error fetching detailed results for ID ${submissionId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch submission details.', error: error.message }),
    };
  }
};