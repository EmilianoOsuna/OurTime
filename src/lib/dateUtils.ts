export const calculateTimeTogether = (startDateString: string) => {
  const start = new Date(startDateString);
  const now = new Date();
  
  if (now.getTime() < start.getTime()) return { years: 0, months: 0, days: 0 };

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonthDate.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};

export const calculateCountdown = (targetDateString: string) => {
  const target = new Date(targetDateString).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

export const generateCalendarMatrix = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const matrix: (number | null)[] = [];

  // Pad the beginning of the month with nulls for empty days
  for (let i = 0; i < firstDayOfMonth; i++) {
    matrix.push(null);
  }

  // Push actual days
  for (let i = 1; i <= daysInMonth; i++) {
    matrix.push(i);
  }

  return matrix;
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const WEEK_DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
