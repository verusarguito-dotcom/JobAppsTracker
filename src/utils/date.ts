export function getTodayWIB(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getDaysDiffWIB(targetDate: string): number {
  const today = getTodayWIB();
  const diffMs = new Date(targetDate).getTime() - new Date(today).getTime();
  return Math.ceil(diffMs / (1000 * 3600 * 24));
}
