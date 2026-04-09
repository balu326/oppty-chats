// Global toast trigger — call from anywhere without React context
let _showToast = null;

export function registerToast(fn) {
  _showToast = fn;
}

export function showToast(message, type = "info") {
  _showToast?.(message, type);
}
