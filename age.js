const form = document.getElementById('birth-form');
const input = document.getElementById('birthdate');
const display = document.getElementById('age-display');
const countdownEl = document.getElementById('birthday-countdown');

function calculateAge(birthDate) {
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  display.textContent = `You are ${years} years, ${months} months and ${days} days old`;
}

function calculateCountdown(birthDate) {
    const now = new Date();
    let nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
    if (nextBirthday < now) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
  
    let months = nextBirthday.getMonth() - now.getMonth();
    let days = nextBirthday.getDate() - now.getDate();
    let hours = nextBirthday.getHours() - now.getHours();
    let minutes = nextBirthday.getMinutes() - now.getMinutes();
    let seconds = nextBirthday.getSeconds() - now.getSeconds();
  
    if (seconds < 0) {
      seconds += 60;
      minutes--;
    }
    if (minutes < 0) {
      minutes += 60;
      hours--;
    }
    if (hours < 0) {
      hours += 24;
      days--;
    }
    if (days < 0) {
      const prevMonth = new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0) {
      months += 12;
    }
  
    countdownEl.textContent = `Another year in: ${months}m ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  
  

function startTimer(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate)) {
    alert("Invalid date. Try again.");
    return;
  }

  form.style.display = 'none';
  display.style.display = 'block';
  countdownEl.style.display = 'block';

  calculateAge(birthDate);
  calculateCountdown(birthDate);

  setInterval(() => {
    calculateAge(birthDate);
    calculateCountdown(birthDate);
  }, 1000);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = input.value;
  if (date) {
    localStorage.setItem('birthdate', date);
    startTimer(date);
  }
});

const savedBirthdate = localStorage.getItem('birthdate');
if (savedBirthdate) {
  startTimer(savedBirthdate);
}
