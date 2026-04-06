const GOALS_CONFIRMED_MONTH_KEY = 'crm_confirmed_goals_month';

export function getConfirmedGoalsMonth(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(GOALS_CONFIRMED_MONTH_KEY) : null;
}

export function setConfirmedGoalsMonth(monthStr: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOALS_CONFIRMED_MONTH_KEY, monthStr);
}

export function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shouldAskNextMonthGoals() {
  const currentMonth = getCurrentMonthStr();
  const confirmedMonth = getConfirmedGoalsMonth();
  return currentMonth !== confirmedMonth;
}
