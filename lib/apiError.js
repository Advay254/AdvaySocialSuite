/* One error type for expected failures. The central handler turns it into the standard JSON shape. */
class ApiError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'error';
    this.extra = extra || null;
  }
}
module.exports = { ApiError };
