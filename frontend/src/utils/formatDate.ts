// SQLite stores UTC timestamps without 'Z' suffix — normalize before parsing
const toISO = (dateString: string) =>
  dateString.includes('Z') ? dateString : dateString + 'Z';

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  return new Date(toISO(dateString)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '';
  return new Date(toISO(dateString)).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
