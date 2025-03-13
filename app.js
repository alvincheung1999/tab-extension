const form = document.getElementById('birth-form');
const input = document.getElementById('birthdate');
const display = document.getElementById('age-display');
const resetBtn = document.getElementById('reset');

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

  display.textContent = `${years} years, ${months} months, ${days} days`;
}

function startTimer(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  form.style.display = 'none';
  display.style.display = 'block';
  resetBtn.style.display = 'inline';

  calculateAge(birthDate);
  setInterval(() => calculateAge(birthDate), 1000);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = input.value;
  if (date) {
    localStorage.setItem('birthdate', date);
    startTimer(date);
  }
});

resetBtn.addEventListener('click', () => {
  localStorage.removeItem('birthdate');
  location.reload();
});

// Auto-load if birthdate is stored
const savedBirthdate = localStorage.getItem('birthdate');
if (savedBirthdate) {
  startTimer(savedBirthdate);
}
