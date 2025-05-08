/**
 * Converts raw scraping text output to properly formatted JSON
 * This is a fallback utility in case the Python script doesn't output JSON directly
 */
export const convertRawScrapingToJson = (rawText) => {
    const leagues = [];
    let currentLeague = null;
    
    // Split the text by lines
    const lines = rawText.split('\r\n');
    
    lines.forEach(line => {
      // Check if this is a league line
      if (line.startsWith('Liga:')) {
        if (currentLeague) {
          // Add previous league to leagues array if it has matches
          if (currentLeague.matches.length > 0) {
            leagues.push(currentLeague);
          }
        }
        
        // Create new league object
        const leagueName = line.replace('Liga:', '').trim();
        currentLeague = {
          name: leagueName,
          logo: "",
          matches: []
        };
      } 
      // Check if this is a logo line
      else if (line.startsWith('Logo:') && currentLeague) {
        currentLeague.logo = line.replace('Logo:', '').trim();
      }
      // Check if this is a match line
      else if (line.startsWith('nombre:') && currentLeague) {
        const matchParts = line.replace('nombre:', '').split(' vs ');
        if (matchParts.length === 2) {
          // Process home team
          const homeParts = matchParts[0].split('|');
          const homeTeamName = homeParts[0].trim();
          const homeTeamLogo = homeParts.length > 1 ? homeParts[1].trim() : "";
          
          // Process away team and time
          const awayAndTime = matchParts[1].split(' - ');
          const awayParts = awayAndTime[0].split('|');
          const awayTeamName = awayParts[0].trim();
          const awayTeamLogo = awayParts.length > 1 ? awayParts[1].trim() : "";
          
          // Get match time
          const matchTime = awayAndTime.length > 1 ? awayAndTime[1].trim() : "";
          
          // Create match object
          const match = {
            homeTeam: {
              name: homeTeamName,
              logo: homeTeamLogo
            },
            awayTeam: {
              name: awayTeamName,
              logo: awayTeamLogo
            },
            time: matchTime,
            date: new Date().toISOString().split('T')[0], // Today's date
            odds: {
              home: "2.00",
              draw: "3.00",
              away: "3.50"
            }
          };
          
          currentLeague.matches.push(match);
        }
      }
    });
    
    // Add the last league if it exists and has matches
    if (currentLeague && currentLeague.matches.length > 0) {
      leagues.push(currentLeague);
    }
    
    return { leagues };
  };
  
  /**
   * Alternative function to use in the Express controller
   */
  export const handleScrapingOutput = (output) => {
    try {
      // First try to parse as JSON
      return JSON.parse(output);
    } catch (e) {
      // If parsing fails, convert the raw text
      return convertRawScrapingToJson(output);
    }
};