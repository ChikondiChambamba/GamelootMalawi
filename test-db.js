const db = require('./config/database');

async function testConnection() {
    try {
        // Test the connection
        const [result] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful!');
        console.log('Test query result:', result[0].solution);

        // Get server information
        const [rows] = await db.query('SELECT VERSION() as version');
        console.log('MySQL Version:', rows[0].version);

        // Show all tables in the database
        const [tables] = await db.query('SHOW TABLES');
        console.log('\nTables in database:');
        tables.forEach(table => {
            console.log('-', Object.values(table)[0]);
        });

        // Test if users table exists and show its structure
        try {
            const [userStructure] = await db.query('DESCRIBE users');
            console.log('\nUsers table structure:');
            userStructure.forEach(field => {
                console.log(`- ${field.Field} (${field.Type})`);
            });
        } catch (error) {
            console.log('\nUsers table does not exist yet');
        }

    } catch (error) {
        console.error('Database connection failed!');
        console.error('Error details:', error);
    } finally {
        // Close the connection pool
        await db.end();
    }
}

console.log('Testing database connection...');
testConnection();