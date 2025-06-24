const { Client } = require('pg');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { parentName, childName, parentEmail, score, expectations, detailedResults, submissionTime } = JSON.parse(event.body);

    const connectionString = process.env.NETLIFY_DATABASE_URL;

    if (!connectionString) {
        console.error('NETLIFY_DATABASE_URL environment variable is not set.');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Database connection string missing.' })
        };
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false // Required for NeonDB in some environments, adjust as needed for your setup
        }
    });

    try {
        await client.connect();

        const insertQuery = `
            INSERT INTO assessments (parent_name, child_name, parent_email, score, expectations, detailed_results, submitted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `;
        const values = [parentName, childName, parentEmail, score, expectations, detailedResults, submissionTime];

        const res = await client.query(insertQuery, values);
        console.log('Submission saved to DB with ID:', res.rows[0].id);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Submission saved successfully!', id: res.rows[0].id })
        };
    } catch (error) {
        console.error('Error saving submission to database:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to save submission to database.', error: error.message })
        };
    } finally {
        await client.end();
    }
};