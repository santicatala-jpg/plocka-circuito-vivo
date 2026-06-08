var targetDate = new Date("2026-09-27T08:00:00-03:00").getTime();

var daysElement = document.getElementById("days");
var hoursElement = document.getElementById("hours");
var minutesElement = document.getElementById("minutes");
var secondsElement = document.getElementById("seconds");

function updateCountdown() {
  var now = new Date().getTime();
  var distance = targetDate - now;

  if (distance <= 0) {
    daysElement.textContent = "000d";
    hoursElement.textContent = "00h";
    minutesElement.textContent = "00m";
    secondsElement.textContent = "00s";
    return;
  }

  var days = Math.floor(distance / (1000 * 60 * 60 * 24));

  var hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  var minutes = Math.floor(
    (distance % (1000 * 60 * 60)) / (1000 * 60)
  );

  var seconds = Math.floor(
    (distance % (1000 * 60)) / 1000
  );

  daysElement.textContent = days + "d";
  hoursElement.textContent = String(hours).padStart(2, "0") + "h";
  minutesElement.textContent = String(minutes).padStart(2, "0") + "m";
  secondsElement.textContent = String(seconds).padStart(2, "0") + "s";
}

updateCountdown();
setInterval(updateCountdown, 1000);