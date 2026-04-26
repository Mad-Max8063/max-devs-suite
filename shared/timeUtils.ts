function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function formatMinutesAsTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Generates HH:mm time slots within a day using a minute interval.
 */
export function generateTimeSlots(
  start: string = '00:00',
  end: string = '23:59',
  interval: number = 30,
): string[] {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null) return [];
  if (!Number.isFinite(interval) || interval <= 0) return [];
  if (startMinutes > endMinutes) return [];

  const slots: string[] = [];
  for (let current = startMinutes; current <= endMinutes && current < 24 * 60; current += interval) {
    slots.push(formatMinutesAsTime(current));
  }

  return slots;
}
