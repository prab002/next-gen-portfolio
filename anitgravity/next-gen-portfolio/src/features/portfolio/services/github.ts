export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0=none, 4=high
}

// Generate realistic looking mock data for last 14 days
export const getMockContributions = (): ContributionDay[] => {
  const data: ContributionDay[] = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // Randomize activity to look realistic (higher on weekdays, lower weekends)
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseActivity = isWeekend ? 1 : 4;
    const randomBoost = Math.floor(Math.random() * 8);
    let count = Math.max(0, baseActivity + randomBoost - 3); // some zeros
    
    if (Math.random() > 0.8) count += 10; // occasional spike
    
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) level = 1;
    if (count > 3) level = 2;
    if (count > 7) level = 3;
    if (count > 12) level = 4;

    data.push({
      date: d.toISOString().split('T')[0],
      count,
      level
    });
  }
  return data;
};
