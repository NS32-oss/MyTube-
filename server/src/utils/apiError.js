class apiError extends Error {
  constructor(
    status,
    message = "Something Went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.status = status;
    this.data = null;
    this.errors = errors;
    this.message = message;
    this.success = false;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default apiError;