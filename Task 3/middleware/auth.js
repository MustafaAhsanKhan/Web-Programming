// Authentication middleware — protects routes from unauthenticated access
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).send('Unauthorized: Please login first');
};

module.exports = isAuthenticated;
