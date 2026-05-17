import { START_LOCATION } from './locations';
import type { ChoiceDelta, LocationId } from './types';

const MIN_MOOD = -3;
const MAX_MOOD = 5;

export interface JourneyState
{
    currentLocationId: LocationId;
    mood: number;
    discoveries: string[];
    keepsakes: string[];
    visited: Set<LocationId>;
    resolvedEvents: Set<string>;
}

export const createJourneyState = (): JourneyState => {
    return {
        currentLocationId: START_LOCATION,
        mood: 0,
        discoveries: [],
        keepsakes: [],
        visited: new Set<LocationId>([START_LOCATION]),
        resolvedEvents: new Set<string>()
    };
};

export const visitLocation = (state: JourneyState, locationId: LocationId) => {
    state.currentLocationId = locationId;
    state.visited.add(locationId);
};

export const resolveJourneyEvent = (state: JourneyState, eventId: string) => {
    state.resolvedEvents.add(eventId);
};

export const applyChoiceDelta = (state: JourneyState, delta: ChoiceDelta) => {
    if (delta.mood !== undefined)
    {
        state.mood = clampMood(state.mood + delta.mood);
    }

    addUniqueValues(state.discoveries, delta.discoveries);
    addUniqueValues(state.keepsakes, delta.keepsakes);
};

export const getMoodLabel = (mood: number) => {
    if (mood <= -2)
    {
        return '低回';
    }

    if (mood <= 0)
    {
        return '沉静';
    }

    if (mood <= 2)
    {
        return '微亮';
    }

    return '轻盈';
};

const clampMood = (mood: number) => {
    return Math.max(MIN_MOOD, Math.min(MAX_MOOD, mood));
};

const addUniqueValues = (target: string[], values?: string[]) => {
    values?.forEach((value) => {
        if (!target.includes(value))
        {
            target.push(value);
        }
    });
};
