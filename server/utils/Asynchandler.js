/**
 * Wraps async Express route handlers — forwards any thrown error to next().
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;