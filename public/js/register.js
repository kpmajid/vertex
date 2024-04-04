const url = "/register";
const btn = document.getElementById("registerBtn");
const full_name = document.getElementById("full_name");
const email = document.getElementById("email");
const mobile = document.getElementById("mobile");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmpassword");

const nameValidationMessage = document.getElementById("nameValidationMessage");
const emailValidationMessage = document.getElementById(
  "emailValidationMessage"
);

const mobileValidationMessage = document.getElementById(
  "mobileValidationMessage"
);

const passwordValidationMessage = document.getElementById(
  "passwordValidationMessage"
);
const confirmPasswordValidationMessage = document.getElementById(
  "confirmPasswordValidationMessage"
);
const validationMessage = document.getElementById("validationMessage");

function validateEmail(email) {
  let validRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const matches = email.match(validRegex);
  return matches !== null && matches[0] === email;
}

console.log(confirmPassword);

btn.addEventListener("click", register);
async function register(event) {
  event.preventDefault();
  console.log("button clicked");

  let isValid = true;

  nameValidationMessage.textContent = "";
  emailValidationMessage.textContent = "";
  passwordValidationMessage.textContent = "";
  confirmPasswordValidationMessage.textContent = "";

  if (full_name.value.trim() === "") {
    nameValidationMessage.textContent = "Full Name is required";
    isValid = false;
  }

  if (email.value.trim() === "") {
    emailValidationMessage.textContent = "Email is required";
    isValid = false;
  } else if (!validateEmail(email.value)) {
    console.log("not epty");
    emailValidationMessage.textContent = "invalid Email";
    isValid = false;
  }

  if (mobile.value.trim() === "") {
    mobileValidationMessage.textContent = "Mobile number is required";
    isValid = false;
  }

  if (password.value.trim() === "") {
    passwordValidationMessage.textContent = "Enter a password";
    isValid = false;
  }

  const hasLower = /[a-z]/.test(password.value);
  const hasUpper = /[A-Z]/.test(password.value);
  const hasNumber = /\d/.test(password.value);

  console.log("hasLower, hasUpper, hasNumber");
  console.log(hasLower, hasUpper, hasNumber);

  if (
    password.value.trim().length < 8 ||
    !hasLower ||
    !hasUpper ||
    !hasNumber
  ) {
    passwordValidationMessage.textContent = "Password requirements not met";
    isValid = false;
  }

  if (confirmPassword.value.trim() == "") {
    confirmPasswordValidationMessage.textContent =
      "Confirm Password is required";
    isValid = false;
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordValidationMessage.textContent =
      "Those passwords didn't match. Try again.";
    isValid = false;
  }
  if (!isValid) {
    return;
  }

  const queryParams = new URLSearchParams(window.location.search);
  const referralCode = queryParams.get("ref");

  try {
    btn.disabled = true;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: full_name.value,
        email: email.value,
        mobile: mobile.value,
        password: password.value,
        ref: referralCode,
      }),
    });
    const jsonData = await response.json();
    console.log(jsonData);
    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Oops...",
        text: `${jsonData.message}`,
      });
      return;
    }
    window.location.assign("/register/otp");
  } catch (error) {
    console.log(error);
  }
}
