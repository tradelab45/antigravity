/**
 * Official NSE (National Stock Exchange of India) Trading Timings & Market Hours Engine
 *
 * Official NSE Market Schedule (Indian Standard Time - IST / UTC+5:30):
 * - Trading Days: Monday to Friday
 * - Pre-Open Session: 09:00 AM – 09:15 AM IST
 * - Regular Continuous Trading Session (Live Buy & Sell execution): 09:15 AM – 03:30 PM IST (09:15 to 15:30)
 * - Post-Closing Session: 03:30 PM – 04:00 PM IST
 * - Closed / After-Hours / Weekend: All day Saturday & Sunday, and weekdays outside 09:15 AM - 03:30 PM IST
 */

export interface NSEMarketInfo {
  isNSEMarketOpen: boolean; // Continuous regular trading session
  isPreOpen: boolean;
  isPostClose: boolean;
  isWeekend: boolean;
  session: 'REGULAR_OPEN' | 'PRE_OPEN' | 'POST_CLOSE' | 'CLOSED_AFTER_HOURS' | 'CLOSED_WEEKEND';
  statusLabel: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  istTimeString: string;
  istDateString: string;
  hoursText: string;
  nextSessionCountdown: string;
  nextOpeningDateString: string;
}

/**
 * Returns current date and time converted to Indian Standard Time (IST, UTC+5:30)
 */
export function getNowInIST(): Date {
  const now = new Date();
  // Get UTC timestamp
  const utcTimestamp = now.getTime() + now.getTimezoneOffset() * 60000;
  // Indian Standard Time is UTC + 5 hours 30 minutes
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(utcTimestamp + istOffset);
}

/**
 * Computes live NSE market session status based on real-time Indian Standard Time
 */
export function getNSEMarketTimeInfo(): NSEMarketInfo {
  const ist = getNowInIST();
  const dayOfWeek = ist.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Key NSE time marks in minutes from midnight (00:00)
  const preOpenStart = 9 * 60; // 09:00 AM
  const marketOpen = 9 * 60 + 15; // 09:15 AM
  const marketClose = 15 * 60 + 30; // 03:30 PM (15:30)
  const postCloseEnd = 16 * 60; // 04:00 PM (16:00)

  const isRegularOpen = !isWeekend && totalMinutes >= marketOpen && totalMinutes < marketClose;
  const isPreOpen = !isWeekend && totalMinutes >= preOpenStart && totalMinutes < marketOpen;
  const isPostClose = !isWeekend && totalMinutes >= marketClose && totalMinutes < postCloseEnd;

  let session: NSEMarketInfo['session'] = 'CLOSED_AFTER_HOURS';
  let statusLabel = 'NSE MARKET CLOSED';
  let badgeColor: NSEMarketInfo['badgeColor'] = 'rose';

  if (isWeekend) {
    session = 'CLOSED_WEEKEND';
    statusLabel = 'WEEKEND MARKET CLOSED';
    badgeColor = 'rose';
  } else if (isRegularOpen) {
    session = 'REGULAR_OPEN';
    statusLabel = 'NSE MARKET OPEN';
    badgeColor = 'emerald';
  } else if (isPreOpen) {
    session = 'PRE_OPEN';
    statusLabel = 'NSE PRE-OPEN SESSION';
    badgeColor = 'amber';
  } else if (isPostClose) {
    session = 'POST_CLOSE';
    statusLabel = 'POST-CLOSING SESSION';
    badgeColor = 'amber';
  } else {
    session = 'CLOSED_AFTER_HOURS';
    statusLabel = 'NSE MARKET CLOSED';
    badgeColor = 'rose';
  }

  // Format IST time and date
  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const istTimeString = `${pad(hours12)}:${pad(minutes)}:${pad(ist.getSeconds())} ${ampm} IST`;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const istDateString = `${dayNames[dayOfWeek]}, ${ist.getDate()} ${monthNames[ist.getMonth()]} ${ist.getFullYear()}`;

  // Next Session Countdown calculation
  let nextSessionCountdown = '';
  let nextOpeningDateString = '';

  if (isRegularOpen) {
    const minutesLeft = marketClose - totalMinutes;
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    nextSessionCountdown = `Closes in ${h > 0 ? `${h}h ` : ''}${m}m`;
  } else {
    // Calculate minutes until next 9:15 AM market opening
    let daysUntilNextOpen = 0;
    if (dayOfWeek === 5 && totalMinutes >= marketClose) {
      // Friday after close -> Monday (3 days)
      daysUntilNextOpen = 3;
    } else if (dayOfWeek === 6) {
      // Saturday -> Monday (2 days)
      daysUntilNextOpen = 2;
    } else if (dayOfWeek === 0) {
      // Sunday -> Monday (1 day)
      daysUntilNextOpen = 1;
    } else if (totalMinutes >= marketClose) {
      // Weekday after close -> Tomorrow (1 day)
      daysUntilNextOpen = 1;
    } else {
      // Same day before 9:15 AM
      daysUntilNextOpen = 0;
    }

    const nextOpeningTargetMinutes = daysUntilNextOpen * 24 * 60 + marketOpen;
    const diffMinutes = nextOpeningTargetMinutes - totalMinutes;
    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;

    nextSessionCountdown = `Opens in ${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m`;
    
    const nextDate = new Date(ist.getTime() + daysUntilNextOpen * 86400000);
    nextOpeningDateString = `${dayNames[nextDate.getDay()]} at 09:15 AM IST`;
  }

  return {
    isNSEMarketOpen: isRegularOpen,
    isPreOpen,
    isPostClose,
    isWeekend,
    session,
    statusLabel,
    badgeColor,
    istTimeString,
    istDateString,
    hoursText: '09:15 AM – 03:30 PM IST (Mon–Fri)',
    nextSessionCountdown,
    nextOpeningDateString,
  };
}
