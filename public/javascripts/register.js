const url = "/register";
const btn = document.getElementById("registerBtn");
const full_name = document.getElementById("full_name");
const email = document.getElementById("email");
const password = document.getElementById("password");

btn.addEventListener("click", async (event) => {
  event.preventDefault();
  console.log("button clicked");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: userName.value,
        email: email.value,
        password: password.value,
      }),
    });
    if (response.redirected) {
      window.location.href = response.url;
    } else {
    const jsonData = await response.json();
      // Work with the parsed JSON data (jsonData) here
    }
  } catch (error) {
    console.log(error);
  }
});
