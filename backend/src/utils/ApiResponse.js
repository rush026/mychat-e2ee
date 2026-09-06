/**
 * Consistent API response formatter.
 * All API responses follow this structure for predictability.
 */
class ApiResponse {
  /**
   * @param {boolean} success
   * @param {string} message
   * @param {*} data
   * @param {object} meta - Pagination or additional metadata
   */
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  static success(message, data = null, meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message, errorCode = 'ERROR', errors = []) {
    const response = new ApiResponse(false, message);
    response.errorCode = errorCode;
    if (errors.length > 0) response.errors = errors;
    return response;
  }

  static paginated(message, data, page, limit, total) {
    return new ApiResponse(true, message, data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  }
}

export default ApiResponse;
