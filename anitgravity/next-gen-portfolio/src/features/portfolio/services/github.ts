export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

// GitHub Event Types for typing the API response
interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    size?: number; // for PushEvent
    commits?: any[];
  };
}

// Response from https://github-contributions-api.jogruber.de/v4/
export interface ContributionYear {
  total: {
    [year: string]: number; // e.g., "2024": 1390
  };
  contributions: Array<{
    date: string; // "2024-01-01"
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>;
}

export interface LatestActivity {
  type: string;
  repo: string;
  message: string;
  timestamp: string;
}

export const getContributionGraph = async (username: string): Promise<ContributionYear | null> => {
    try {
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
        if (!res.ok) throw new Error('Failed to fetch graph');
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const getLatestActivity = async (username: string): Promise<LatestActivity | null> => {
    try {
        const res = await fetch(`https://api.github.com/users/${username}/events?per_page=5`);
        if (!res.ok) throw new Error('Failed to fetch events');
        const events: GitHubEvent[] = await res.json();
        
        // Find first interesting event
        const pushEvent = events.find(e => e.type === 'PushEvent');
        if (pushEvent) {
             const commitMsg = pushEvent.payload.commits?.[0]?.message || 'Code update';
             return {
                 type: 'Push',
                 repo: (pushEvent as any).repo?.name || 'unknown/repo',
                 message: commitMsg,
                 timestamp: pushEvent.created_at
             };
        }
        
        // Fallback to CreateEvent
        const createEvent = events.find(e => e.type === 'CreateEvent');
        if (createEvent) {
            return {
                type: 'Create',
                repo: (createEvent as any).repo?.name || 'new-project',
                message: 'Created new repository',
                timestamp: createEvent.created_at
            };
        }

        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

// Keep the old function for backward compatibility or direct array usage if needed, 
// but we will likely shift to the graph structure.
export const getRealContributions = async (username: string = 'prabhanjan002'): Promise<ContributionDay[]> => {
  // ... (keep existing implementation or deprecate)
  return []; 
};

// Mock data generator (updated to match new structure if needed, or kept for fallback)
export const getMockGraph = (): ContributionYear => {
    const contributions = [];
    const today = new Date();
    // Generate ~365 days back
    for (let i = 365; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const count = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
        contributions.push({
            date: d.toISOString().split('T')[0],
            count,
            level: (count > 0 ? (count > 3 ? 4 : (count > 1 ? 2 : 1)) : 0) as any
        });
    }
    return {
        total: { "lastYear": contributions.reduce((a, b) => a + b.count, 0) },
        contributions
    };
};
