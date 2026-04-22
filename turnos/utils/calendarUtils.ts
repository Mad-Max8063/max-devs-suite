/**
 * calendarUtils.ts
 * Lógica pura para la generación de archivos y enlaces de calendario.
 * Cumple con el estándar RFC 5545 para iCal.
 */

export interface CalendarAppointment {
  id?: string;
  title: string;
  description: string;
  location?: string;
  startTime: string; // Formato ISO 8601 o string de fecha compatible
  endTime?: string;
  durationMinutes?: number;
}

export interface CalendarBusiness {
  name: string;
  phone?: string;
  address?: string;
}

/**
 * Formatea una fecha para el formato requerido por Google y Outlook (YYYYMMDDTHHmmssZ)
 */
const formatToCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Genera los diferentes enlaces y archivos para integración de calendarios.
 */
export const generateCalendarLinks = (appointment: CalendarAppointment, business: CalendarBusiness) => {
  const start = new Date(appointment.startTime);
  const end = appointment.endTime 
    ? new Date(appointment.endTime) 
    : new Date(start.getTime() + (appointment.durationMinutes || 60) * 60000);

  const title = encodeURIComponent(appointment.title);
  const description = encodeURIComponent(`${appointment.description}\n\nNegocio: ${business.name}\nContacto: ${business.phone || 'N/A'}`);
  const location = encodeURIComponent(appointment.location || business.address || '');
  
  const timeRange = `${formatToCalendarDate(start)}/${formatToCalendarDate(end)}`;

  // 1. Google Calendar
  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${timeRange}&details=${description}&location=${location}&sf=true&output=xml`;

  // 2. Outlook Web
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${description}&location=${location}`;

  // 3. Apple/iCal (Blob para descarga)
  const generateICalBlob = (): Blob => {
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Suito//Gestor de Turnos//ES',
      'BEGIN:VEVENT',
      `UID:${appointment.id || Math.random().toString(36).substring(2)}@suito.app`,
      `DTSTAMP:${formatToCalendarDate(new Date())}`,
      `DTSTART:${formatToCalendarDate(start)}`,
      `DTEND:${formatToCalendarDate(end)}`,
      `SUMMARY:${appointment.title}`,
      `DESCRIPTION:${appointment.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${appointment.location || business.address || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  };

  return {
    googleUrl,
    outlookUrl,
    downloadICal: () => {
      const blob = generateICalBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `turno-${appointment.id || 'reserva'}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
};
