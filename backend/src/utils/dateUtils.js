/**
 * Date utilities for handling PST/PDT timezone operations
 * UCLA is in Pacific Time, so all "today" logic should be based on PT, not UTC
 */

// Get current date in PST/PDT format (YYYY-MM-DD)
function getPSTDateString(date = new Date()) {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles'
  });
}

// Get start of day in PST/PDT as UTC Date object
function getPSTStartOfDay(date = new Date()) {
  const pstDateStr = getPSTDateString(date);
  // Create a date in PST and convert to UTC
  const pstDate = new Date(pstDateStr + 'T00:00:00-08:00'); // Assumes PST, but will auto-adjust for PDT
  return pstDate;
}

// Get end of day in PST/PDT as UTC Date object  
function getPSTEndOfDay(date = new Date()) {
  const pstDateStr = getPSTDateString(date);
  // Create end of day in PST and convert to UTC
  const pstDate = new Date(pstDateStr + 'T23:59:59-08:00'); // Assumes PST, but will auto-adjust for PDT
  return pstDate;
}

// Check if a UTC date falls on "today" in PST/PDT
function isToday(utcDate, referenceDate = new Date()) {
  const utcDatePST = getPSTDateString(utcDate);
  const todayPST = getPSTDateString(referenceDate);
  return utcDatePST === todayPST;
}

// Convert UTC date to PST date string
function utcDateToPSTString(utcDate) {
  return getPSTDateString(utcDate);
}

module.exports = {
  getPSTDateString,
  getPSTStartOfDay,
  getPSTEndOfDay,
  isToday,
  utcDateToPSTString
}; 