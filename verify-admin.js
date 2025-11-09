const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function verifyAdmin(email, password) {
    try {
        // Find the user
        const user = await User.findByEmail(email);
        if (!user) {
            console.log('No user found with this email');
            return;
        }

        console.log('User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            hashedPassword: user.password ? 'exists' : 'missing'
        });

        // Try to verify password
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValid);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Use the admin credentials you're trying to log in with
verifyAdmin('admin@gamelootmalawi.com', 'your-password-here');