export function getTime30MinutesEarlier(inputTime) {

    // Parse the input time to extract hour, minute, and AM/PM information
    const match = inputTime.match(/^(\d+):(\d+)\s+(AM|PM)$/i);

    if (!match) {
        throw new Error('Invalid time format. Expected format: "12:00 AM" or "1:00 PM".');
    }

    let [, hours, minutes, ampm] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    // Convert the time to minutes
    let totalMinutes = hours * 60 + minutes;

    // Subtract 30 minutes
    totalMinutes -= 30;

    // Handle edge cases when the time crosses the boundaries of AM/PM
    if (totalMinutes < 0) {
        totalMinutes += 720; // 12 hours in minutes
    }

    // Convert back to hours and minutes
    hours = Math.floor(totalMinutes / 60);
    minutes = totalMinutes % 60;

    // Convert back to AM/PM format
    ampm = totalMinutes >= 720 ? 'PM' : 'AM';

    // Format the new time back into the original string format
    return `${hours === 0 ? '12' : (hours > 12 ? hours - 12 : hours)}:${minutes.toString().padStart(2, '0')} ${ampm}`;

}

// timeUtils.js
export function getTime30MinutesLater(inputTime) {
    const match = inputTime.match(/^(\d+):(\d+)\s+(AM|PM)$/i);
  
    if (!match) {
      throw new Error('Invalid time format. Expected format: "12:00 AM" or "1:00 PM".');
    }
  
    let [, hours, minutes, ampm] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
  
    // Convert the time to minutes
    let totalMinutes = hours * 60 + minutes;
  
    // Add 30 minutes
    totalMinutes += 30;
  
    // Handle edge cases when the time crosses the boundaries of AM/PM
    if (totalMinutes >= 720) {
      totalMinutes -= 720; // 12 hours in minutes
    }
  
    // Convert back to hours and minutes
    hours = Math.floor(totalMinutes / 60);
    minutes = totalMinutes % 60;
  
    // Convert back to AM/PM format
    ampm = totalMinutes >= 720 ? 'PM' : 'AM';
  
    // Format the new time back into the original string format
    return `${hours === 0 ? '12' : (hours > 12 ? hours - 12 : hours)}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
  