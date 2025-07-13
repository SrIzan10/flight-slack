export function getRange(date?: Date, days = 1): { begin: number; end: number } {
  const startDate = date ? new Date(date) : new Date();
  const begin = Math.floor(startDate.setHours(0, 0, 0, 0) / 1000);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);
  const end = Math.floor(endDate.setHours(23, 59, 59, 999) / 1000);

  return { begin, end };
}

// AI GENERATED CODE BEGINS HERE
export function parseDate(input?: string, todayBeginCurrentTime = false): { date: { begin: number; end: number } | null; error?: string } {
  // No date provided - use today
  if (!input || input.trim() === '') {
    if (todayBeginCurrentTime) {
      const now = new Date();
      const begin = Math.floor(now.getTime() / 1000);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const end = Math.floor(endOfDay.getTime() / 1000);
      return { date: { begin, end } };
    }
    return { date: getRange() };
  }

  const cleaned = input.trim().toLowerCase();
  
  // Handle relative dates
  if (cleaned === 'today') {
    if (todayBeginCurrentTime) {
      const now = new Date();
      const begin = Math.floor(now.getTime() / 1000);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const end = Math.floor(endOfDay.getTime() / 1000);
      return { date: { begin, end } };
    }
    return { date: getRange() };
  }
  
  if (cleaned === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: getRange(tomorrow) };
  }

  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValidDate(date)) {
      return { date: getRange(date) };
    }
  }

  // Try DD-MM-YY or DD/MM/YY format (European)
  const euroMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (euroMatch && euroMatch[1] && euroMatch[2] && euroMatch[3]) {
    const [, day, month, year] = euroMatch;
    const fullYear = expandYear(parseInt(year));
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    if (isValidDate(date)) {
      return { date: getRange(date) };
    }
  }

  // Try natural language dates
  const naturalDate = parseNaturalDate(cleaned);
  if (naturalDate) {
    return { date: getRange(naturalDate) };
  }

  return { 
    date: null, 
    error: "Please use formats like: today, tomorrow, 15-01-25, 2025-01-15, or 15/01/2025" 
  };
}

function isValidDate(date: Date): boolean {
  if (isNaN(date.getTime())) return false;
  
  // Check if date is not too far in the past or future
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  
  return date >= oneYearAgo && date <= twoYearsFromNow;
}

function expandYear(year: number): number {
  if (year >= 2000) return year;
  if (year >= 50) return 1900 + year;
  return 2000 + year;
}

function parseNaturalDate(input: string): Date | null {
  const now = new Date();
  
  // Handle "next monday", "this friday", etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (let i = 0; i < dayNames.length; i++) {
    const dayName = dayNames[i];
    if (dayName && input.includes(dayName)) {
      const targetDay = i;
      const currentDay = now.getDay();
      
      let daysToAdd = targetDay - currentDay;
      if (input.includes('next') || daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysToAdd);
      return targetDate;
    }
  }
  
  return null;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}
// AI GENERATED CODE ENDS HERE
