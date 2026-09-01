/**
 * Response shaping. Follows the { success, data } / { success, error }
 * shape sketched in MASTER_SPECIFICATION.md §23. Never leaks raw internal
 * error objects/stack traces to the client (§10, §24 of the dev instructions).
 */

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'Internal server error' : err.message;
  return res.status(status).json({ success: false, error: { code, message } });
}

/** Wrap an async controller so thrown errors are handled uniformly. */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => fail(res, err));
  };
}

module.exports = { ok, fail, asyncHandler };
