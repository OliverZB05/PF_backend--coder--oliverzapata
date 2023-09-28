function logMessage(logger, req, level, message) {
    logger.log(level, `${req.method} en ${req.url} - ${new Date().toISOString()} - ${message}`);
}

export { logMessage };