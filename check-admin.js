const db = require('./config/database');

async function checkAdminUser() {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE role = ?',
            ['admin']
        );

        console.log('Admin users in database:');
        users.forEach(user => {
            console.log('\nUser Details:');
            console.log('- ID:', user.id);
            console.log('- Name:', user.name);
            console.log('- Email:', user.email);
            console.log('- Role:', user.role);
            console.log('- Created:', user.created_at);
        });

    } catch (error) {
        console.error('Error checking admin users:', error);
    } finally {
        await db.end();
    }
}

console.log('Checking admin users...');
checkAdminUser();