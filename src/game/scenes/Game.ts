import { Scene } from 'phaser';
import {
    ARRIVAL_EVENT_DELAY,
    INITIAL_WORLD_OFFSET,
    TRAVEL_BASE_DURATION,
    TRAVEL_DISTANCE_FACTOR
} from '../config';
import {
    EVENTS,
    LOCATIONS,
    applyChoiceDelta,
    createJourneyState,
    resolveJourneyEvent,
    visitLocation,
    type EventCard,
    type EventChoice,
    type JourneyState,
    type Route
} from '../journey';
import { GameHud } from '../ui/Hud';
import { EventCardOverlay } from '../ui/EventCardOverlay';
import { RouteButtons } from '../ui/RouteButtons';
import { ParallaxWorld } from '../world/ParallaxWorld';
import { easeInOutSine } from '../world/travelerAnimation';

export class Game extends Scene
{
    private world: ParallaxWorld;
    private hud: GameHud;
    private routeButtons: RouteButtons;
    private eventOverlay: EventCardOverlay;
    private pendingRoute: Route | null = null;
    private state: JourneyState;
    private isTraveling = false;
    private travelElapsed = 0;
    private travelDuration = 0;
    private travelStartOffset = INITIAL_WORLD_OFFSET;
    private travelDistance = 0;
    private worldOffset = INITIAL_WORLD_OFFSET;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.resetJourney();
        this.cameras.main.setBackgroundColor(0x07111c);
        this.world = new ParallaxWorld(this, this.worldOffset);
        this.hud = new GameHud(this);
        this.routeButtons = new RouteButtons(this, (route) => {
            this.travelTo(route);
        });
        this.eventOverlay = new EventCardOverlay(this, (event, choice) => {
            this.resolveEventChoice(event, choice);
        });
        this.renderLocation('选择一块路牌，旅人会自己继续前行。');
    }

    update (time: number, delta: number)
    {
        if (this.isTraveling && this.pendingRoute)
        {
            this.travelElapsed += delta;

            const progress = Math.min(this.travelElapsed / this.travelDuration, 1);
            const eased = easeInOutSine(progress);

            this.worldOffset = this.travelStartOffset + (this.travelDistance * eased);

            if (progress >= 1)
            {
                this.finishTravel();
            }
        }

        this.world.update(this.worldOffset, this.isTraveling, time);
    }

    private resetJourney ()
    {
        this.state = createJourneyState();
        this.pendingRoute = null;
        this.isTraveling = false;
        this.travelElapsed = 0;
        this.travelDuration = 0;
        this.travelStartOffset = INITIAL_WORLD_OFFSET;
        this.travelDistance = 0;
        this.worldOffset = INITIAL_WORLD_OFFSET;
    }

    private renderLocation (logMessage?: string)
    {
        const location = LOCATIONS[this.state.currentLocationId];

        this.hud.renderLocation(location, this.state, logMessage);
        this.routeButtons.clear();

        if (!this.eventOverlay.isOpen && !this.isTraveling)
        {
            this.routeButtons.show(location.routes, this.state);
        }
    }

    private travelTo (route: Route)
    {
        if (this.isTraveling || this.eventOverlay.isOpen)
        {
            return;
        }

        const target = LOCATIONS[route.target];

        this.pendingRoute = route;
        this.isTraveling = true;
        this.travelElapsed = 0;
        this.travelDuration = TRAVEL_BASE_DURATION + Math.round(route.distance * TRAVEL_DISTANCE_FACTOR);
        this.travelStartOffset = this.worldOffset;
        this.travelDistance = route.distance;

        this.routeButtons.clear();
        this.hud.renderTravel(target.name, route.travelText);
    }

    private finishTravel ()
    {
        if (!this.pendingRoute)
        {
            return;
        }

        const targetId = this.pendingRoute.target;
        const location = LOCATIONS[targetId];

        visitLocation(this.state, targetId);
        this.isTraveling = false;
        this.pendingRoute = null;

        this.renderLocation(`抵达「${location.name}」。`);

        this.time.delayedCall(ARRIVAL_EVENT_DELAY, () => {
            this.showArrivalEvent(location.eventId);
        });
    }

    private showArrivalEvent (eventId: string)
    {
        if (this.state.resolvedEvents.has(eventId))
        {
            this.renderLocation('这里只剩你上次留下的脚印。');
            return;
        }

        const event = EVENTS[eventId];
        this.routeButtons.clear();
        this.eventOverlay.show(event);
    }

    private resolveEventChoice (event: EventCard, choice: EventChoice)
    {
        resolveJourneyEvent(this.state, event.id);
        applyChoiceDelta(this.state, choice.delta);
        this.eventOverlay.close();
        this.renderLocation(choice.result);
    }
}
