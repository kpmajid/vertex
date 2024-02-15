const url = "/register/otp";
const otp = document.getElementById("otp");
const btn = document.getElementById("submitBtn");

btn.addEventListener("click", async (event) => {
  event.preventDefault();
  console.log("OTP submitted");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        otp: otp.value,
      }),
    });
    if (response.redirected) {
      window.location.href = response.url;
    } else {
      const jsonData = await response.json();
      console.log(jsonData.message);
    }
  } catch (error) {
    console.log(error);
  }
});
