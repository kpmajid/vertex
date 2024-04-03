const passwordRequirements = document.getElementById("passwordRequirements");
const passwordInput = document.getElementById("password");
const lengthReq = document.getElementById("lengthReq");
const lowerReq = document.getElementById("lowerReq");
const upperReq = document.getElementById("upperReq");
const numberReq = document.getElementById("numberReq");

passwordInput.addEventListener('focus', () => {
  const inputRect = passwordInput.getBoundingClientRect();
  passwordRequirements.style.display = 'block';

});

passwordInput.addEventListener('blur', () => {
  passwordRequirements.style.display = 'none';
});


function checkPasswordRequirements() {
  const password = passwordInput.value;
  const minLength = 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  lengthReq.classList.toggle("valid", password.length >= minLength);
  lowerReq.classList.toggle("valid", hasLower);
  upperReq.classList.toggle("valid", hasUpper);
  numberReq.classList.toggle("valid", hasNumber);
}

passwordInput.addEventListener("input", checkPasswordRequirements);


