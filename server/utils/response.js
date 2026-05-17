export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const sendCreated = (res, data = null, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

export const sendPaginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({ success: true, message, data, pagination });