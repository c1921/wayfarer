export type LocationId = 'mist-path' | 'old-bridge' | 'gray-tower' | 'moonwell';

export interface Route
{
    target: LocationId;
    label: string;
    travelText: string;
    distance: number;
}

export interface LocationNode
{
    id: LocationId;
    name: string;
    subtitle: string;
    description: string;
    routes: Route[];
    eventId: string;
}

export interface ChoiceDelta
{
    mood?: number;
    discoveries?: string[];
    keepsakes?: string[];
}

export interface EventChoice
{
    label: string;
    result: string;
    delta: ChoiceDelta;
}

export interface EventCard
{
    id: string;
    title: string;
    body: string;
    choices: EventChoice[];
}
