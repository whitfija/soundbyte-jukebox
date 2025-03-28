const admin = require('firebase-admin');

// session authentication
exports.requireAuth = async (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    }
    
    req.session.returnTo = req.originalUrl;
    
    // check for password in query
    if (req.query.password) {
        try {
            const creds = await admin.firestore().collection('settings').doc('cred').get();
            if (req.query.password === creds.data().jakobpassword) {
                req.session.authenticated = true;
                return next();
            }
        } catch (error) {
            console.error('Error checking password:', error);
        }
    }
    
    // Not authenticated - show login page
    res.render('login');
};

// verify password from form submission
exports.checkPassword = async (req, res, next) => {
    const { password } = req.body;
    if (!password) {
        return res.status(401).send('Password required');
    }
    
    try {
        const creds = await admin.firestore().collection('settings').doc('cred').get();
        if (password === creds.data().jakobpassword) {
            req.session.authenticated = true;
            return next();
        }
        res.status(403).send('Incorrect password');
    } catch (error) {
        console.error('Error checking password:', error);
        res.status(500).send('Authentication error');
    }
};