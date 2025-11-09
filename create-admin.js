const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function testUserCreation() {
    try {
        // Create test admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [result] = await db.query(
            `INSERT INTO users (name, email, password, role, is_active) 
             VALUES (?, ?, ?, 'admin', true)`,
            ['Admin User', 'admin@gamelootmalawi.com', hashedPassword]
        );

        console.log('Test admin user created successfully!');
        console.log('User ID:', result.insertId);

        // Verify the user was created
        const [user] = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [result.insertId]
        );

        console.log('\nCreated user details:');
        console.log(user[0]);

    } catch (error) {
        console.error('Error creating test user:');
        console.error(error);
    } finally {
        await db.end();
    }
}

console.log('Creating test admin user...');
testUserCreation();