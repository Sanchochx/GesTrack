/**
 * Date utilities with Spanish Intl formatting
 * US-CUST-002 CA-9: Relative date display
 */

/**
 * Returns a relative date object for display
 * @param {string} isoString - ISO date string
 * @returns {{ text: string, isWarning: boolean, exactDate: string }}
 */
export const getRelativeDate = (isoString) => {
  if (!isoString) {
    return { text: 'Sin compras', isWarning: false, exactDate: '' };
  }

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const exactDate = new Intl.DateTimeFormat('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  // Warning if > 6 months ago
  const isWarning = diffDays > 180;

  let text;
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (diffDays === 0) {
    text = 'Hoy';
  } else if (diffDays === 1) {
    text = rtf.format(-1, 'day');
  } else if (diffDays < 7) {
    text = rtf.format(-diffDays, 'day');
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    text = rtf.format(-weeks, 'week');
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    text = rtf.format(-months, 'month');
  } else {
    const years = Math.floor(diffDays / 365);
    text = rtf.format(-years, 'year');
  }

  return { text, isWarning, exactDate };
};
