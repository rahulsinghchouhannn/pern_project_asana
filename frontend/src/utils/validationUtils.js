const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isRequired = (value) => {
  return value !== undefined && value !== null && value !== "";
};

const minLength = (value, min) => {
  return String(value).length >= min;
};

const maxLength = (value, max) => {
  return String(value).length <= max;
};

export { isValidEmail, isRequired, minLength, maxLength };
