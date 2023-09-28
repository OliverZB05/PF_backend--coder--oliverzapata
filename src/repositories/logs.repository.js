const logMessage = (req, level, message) => {
    req.logger(req, level, message);
}

export { logMessage };
