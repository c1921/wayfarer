import { GameObjects, Scene, TintModes } from 'phaser';
import {
    EVENTS,
    LOCATIONS,
    START_LOCATION,
    type ChoiceDelta,
    type EventCard,
    type EventChoice,
    type LocationId,
    type Route
} from '../journey';

const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;
// 道路
const ROAD_Y = 660;
const ROAD_HEIGHT = 40;

// 旅人
const TRAVELER_X = 296;
const TRAVELER_Y = 720;
const TRAVELER_SCALE = 0.22;
const TRAVELER_SHADOW_X = 292;
const TRAVELER_SHADOW_Y = 660;
const TRAVELER_SHADOW_WIDTH = 132;
const TRAVELER_SHADOW_HEIGHT = 16;

// 视差
const VISTA_PARALLAX = 0.16;
const ROAD_PARALLAX = 0.86;

// 旅人动画
const TRAVELER_BOB_PERIOD_FAST = 115;
const TRAVELER_BOB_PERIOD_SLOW = 900;
const TRAVELER_BOB_AMP_TRAVEL = 4;
const TRAVELER_BOB_AMP_IDLE = 1.4;
const TRAVELER_ROT_PERIOD_FAST = 170;
const TRAVELER_ROT_PERIOD_SLOW = 1200;
const TRAVELER_ROT_AMP_TRAVEL = 0.012;
const TRAVELER_ROT_AMP_IDLE = 0.004;

// 旅行
const TRAVEL_BASE_DURATION = 2200;
const TRAVEL_DISTANCE_FACTOR = 0.45;

// UI
const VIGNETTE_ALPHA = 0.18;
const ROUTE_BUTTON_Y = 708;
const EVENT_CARD_Y = 382;
const EVENT_CHOICE_BASE_Y = 410;
const EVENT_CHOICE_SPACING = 72;
const EVENT_FADE_DURATION = 160;
const ARRIVAL_EVENT_DELAY = 220;

const UI_FONT = 'Microsoft YaHei, SimHei, Arial';
const FOREST_RANDOM_SEED = 83721;
const FOREST_SPRITE_ALPHA = 1;

interface JourneyState
{
    currentLocationId: LocationId;
    mood: number;
    discoveries: string[];
    keepsakes: string[];
    visited: Set<LocationId>;
    resolvedEvents: Set<string>;
}

interface ForestPlacementConfig
{
    key: string;
    baseX: number;
    y: number;
    scale: number;
    alpha: number;
    depth: number;
    flipX?: boolean;
    tint?: number;
    tintMode?: number;
    blur?: boolean;
}

interface ForestSprite extends ForestPlacementConfig
{
    image: GameObjects.Image;
}

interface ForestLayer
{
    parallax: number;
    span: number;
    sprites: ForestSprite[];
}

interface ForestLayerSpec
{
    parallax: number;
    span: number;
    count: number;
    keys: string[];
    xStart: number;
    xSpacing: number;
    xJitter: number;
    yBase: number;
    yJitter: number;
    scaleBase: number;
    scaleJitter: number;
    depth: number;
    tints?: number[];
    flipIndexes?: number[];
    tintMode?: number;
    blur?: boolean;
}

const FOREST_LAYER_SPECS: ForestLayerSpec[] = [
    {
        parallax: 0.2,
        span: 1680,
        count: 7,
        keys: ['forest-far-pines-a', 'forest-far-pines-b'],
        xStart: 0,
        xSpacing: 240,
        xJitter: 22,
        yBase: 666,
        yJitter: 12,
        scaleBase: 0.38,
        scaleJitter: 0.04,
        depth: 2.6,
        tints: [0x91a4bd, 0x8096ae, 0x7c8fa5, 0x879bb2, 0x8296ad, 0x788ca3, 0x8da1b8],
        flipIndexes: [2, 3, 6]
    },
    {
        parallax: 0.5,
        span: 1820,
        count: 10,
        keys: ['forest-mid-pine-a', 'forest-mid-pine-b'],
        xStart: 0,
        xSpacing: 180,
        xJitter: 18,
        yBase: 700,
        yJitter: 21,
        scaleBase: 0.8,
        scaleJitter: 0.05,
        depth: 4.0,
        tints: [0xb2c4dc, 0x9eb1ca, 0xa7bad2, 0xa0b5cc, 0x91a5bd, 0xa8b9cf, 0xb0c1d8, 0x9badc4, 0xa1b4cc, 0x94a8c0],
        flipIndexes: [2, 3, 6, 7]
    },
    {
        parallax: 0.56,
        span: 1640,
        count: 8,
        keys: ['forest-bush-a', 'forest-bush-b'],
        xStart: 40,
        xSpacing: 210,
        xJitter: 16,
        yBase: 700,
        yJitter: 10,
        scaleBase: 0.24,
        scaleJitter: 0.02,
        depth: 4.3,
        tints: [0x94a7bc, 0x8498ae, 0x9badc2, 0x889cb2, 0x90a4bb, 0x8195ac, 0x8fa3b9, 0x879bb1],
        flipIndexes: [1, 2, 5, 6]
    },
    {
        parallax: 0.76,
        span: 1580,
        count: 9,
        keys: ['forest-bush-a', 'forest-bush-b'],
        xStart: 0,
        xSpacing: 175,
        xJitter: 14,
        yBase: 774,
        yJitter: 12,
        scaleBase: 0.30,
        scaleJitter: 0.1,
        depth: 6.5,
        tints: [0x061018],
        flipIndexes: [1, 2, 5, 6],
        tintMode: TintModes.FILL,
        blur: true
    }
];

export class Game extends Scene
{
    private vista: GameObjects.TileSprite;
    private roadLayer: GameObjects.TileSprite;
    private traveler: GameObjects.Image;
    private locationText: GameObjects.Text;
    private subtitleText: GameObjects.Text;
    private descriptionText: GameObjects.Text;
    private statsText: GameObjects.Text;
    private logText: GameObjects.Text;
    private forestLayers: ForestLayer[] = [];
    private routeButtons: GameObjects.Container[] = [];
    private eventPanel: GameObjects.Container | null = null;
    private pendingRoute: Route | null = null;
    private state: JourneyState;
    private isTraveling = false;
    private travelElapsed = 0;
    private travelDuration = 0;
    private travelStartOffset = 260;
    private travelDistance = 0;
    private worldOffset = 260;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.resetJourney();
        this.cameras.main.setBackgroundColor(0x07111c);
        this.createParallaxTextures();
        this.createWorld();
        this.createHud();
        this.renderLocation('选择一块路牌，旅人会自己继续前行。');
    }

    update (time: number, delta: number)
    {
        if (this.isTraveling && this.pendingRoute)
        {
            this.travelElapsed += delta;

            const progress = Math.min(this.travelElapsed / this.travelDuration, 1);
            const eased = this.easeInOutSine(progress);

            this.worldOffset = this.travelStartOffset + (this.travelDistance * eased);

            if (progress >= 1)
            {
                this.finishTravel();
            }
        }

        this.applyParallax();
        this.animateTraveler(time);
    }

    private resetJourney ()
    {
        this.state = {
            currentLocationId: START_LOCATION,
            mood: 0,
            discoveries: [],
            keepsakes: [],
            visited: new Set<LocationId>([START_LOCATION]),
            resolvedEvents: new Set<string>()
        };
        this.eventPanel = null;
        this.pendingRoute = null;
        this.isTraveling = false;
        this.travelElapsed = 0;
        this.travelDuration = 0;
        this.travelStartOffset = 260;
        this.travelDistance = 0;
        this.worldOffset = 260;
    }

    private createWorld ()
    {
        this.vista = this.add.tileSprite(512, 384, GAME_WIDTH, GAME_HEIGHT, 'background-vista');
        this.vista.setDepth(0);
        this.vista.setTileScale(0.86, 0.86);
        this.vista.tilePositionY = 38;

        this.add.rectangle(512, 384, GAME_WIDTH, GAME_HEIGHT, 0x07111c, VIGNETTE_ALPHA).setDepth(1);

        this.createForestLayers();

        this.roadLayer = this.add.tileSprite(512, ROAD_Y, GAME_WIDTH, ROAD_HEIGHT, 'road-strip');
        this.roadLayer.setDepth(3.5);

        this.add.ellipse(TRAVELER_SHADOW_X, TRAVELER_SHADOW_Y, TRAVELER_SHADOW_WIDTH, TRAVELER_SHADOW_HEIGHT, 0x020407, 0.46).setDepth(3.8);

        this.traveler = this.add.image(TRAVELER_X, TRAVELER_Y, 'traveler');
        this.traveler.setOrigin(0.5, 1);
        this.traveler.setScale(TRAVELER_SCALE);
        this.traveler.setDepth(5.5);

        this.add.rectangle(512, (ROAD_Y + GAME_HEIGHT) / 2, GAME_WIDTH, GAME_HEIGHT - ROAD_Y, 0x000000, 1).setDepth(3.0);
    }

    private createHud ()
    {
        this.add.rectangle(284, 72, 520, 112, 0x07111c, 0.72).setStrokeStyle(1, 0x8ca7b8, 0.45).setDepth(20);
        this.add.rectangle(836, 76, 314, 120, 0x07111c, 0.7).setStrokeStyle(1, 0x8ca7b8, 0.4).setDepth(20);
        this.add.rectangle(512, 620, 650, 44, 0x07111c, 0.66).setStrokeStyle(1, 0x8ca7b8, 0.35).setDepth(20);

        this.locationText = this.add.text(46, 30, '', {
            fontFamily: UI_FONT,
            fontSize: 30,
            color: '#edf6fb'
        }).setDepth(21);

        this.subtitleText = this.add.text(48, 66, '', {
            fontFamily: UI_FONT,
            fontSize: 16,
            color: '#b8cad8'
        }).setDepth(21);

        this.descriptionText = this.add.text(48, 92, '', {
            fontFamily: UI_FONT,
            fontSize: 16,
            color: '#d6e1e8'
        }).setDepth(21);

        this.statsText = this.add.text(704, 34, '', {
            fontFamily: UI_FONT,
            fontSize: 15,
            color: '#dcebf2',
            lineSpacing: 6
        }).setDepth(21);

        this.logText = this.add.text(512, 620, '', {
            fontFamily: UI_FONT,
            fontSize: 17,
            color: '#edf6fb',
            align: 'center'
        }).setOrigin(0.5).setDepth(21);
    }

    private renderLocation (logMessage?: string)
    {
        const location = LOCATIONS[this.state.currentLocationId];

        this.locationText.setText(location.name);
        this.subtitleText.setText(location.subtitle);
        this.descriptionText.setText(location.description);
        this.updateStatsText();
        this.clearRouteButtons();

        if (!this.eventPanel && !this.isTraveling)
        {
            this.createRouteButtons(location.routes);
        }

        if (logMessage)
        {
            this.logText.setText(logMessage);
        }
    }

    private updateStatsText ()
    {
        const discoveries = this.state.discoveries.length === 0
            ? '无'
            : this.state.discoveries.slice(-2).join('、');
        const keepsakes = this.state.keepsakes.length === 0
            ? '无'
            : this.state.keepsakes.slice(-2).join('、');

        this.statsText.setText([
            `心情：${this.getMoodLabel()}`,
            `见闻：${this.state.discoveries.length}  ${discoveries}`,
            `纪念品：${this.state.keepsakes.length}  ${keepsakes}`,
            `已抵达：${this.state.visited.size}/4`
        ].join('\n'));
    }

    private createRouteButtons (routes: Route[])
    {
        const spacing = 292;
        const baseX = 512 - ((routes.length - 1) * spacing / 2);

        routes.forEach((route, index) => {
            const target = LOCATIONS[route.target];
            const visitedText = this.state.visited.has(route.target) ? '已走过的路' : '未抵达';
            const x = baseX + (index * spacing);
            const container = this.add.container(x, ROUTE_BUTTON_Y);
            const panel = this.add.rectangle(0, 0, 258, 62, 0x122333, 0.94);
            const label = this.add.text(0, -12, target.name, {
                fontFamily: UI_FONT,
                fontSize: 21,
                color: '#f2fbff'
            }).setOrigin(0.5);
            const meta = this.add.text(0, 16, visitedText, {
                fontFamily: UI_FONT,
                fontSize: 13,
                color: '#a8becd'
            }).setOrigin(0.5);

            panel.setStrokeStyle(1, 0xa9c2d2, 0.7);
            panel.setInteractive({ useHandCursor: true });
            panel.on('pointerover', () => {
                panel.setFillStyle(0x1e3a4f, 0.98);
                meta.setColor('#d2e4ee');
            });
            panel.on('pointerout', () => {
                panel.setFillStyle(0x122333, 0.94);
                meta.setColor('#a8becd');
            });
            panel.on('pointerdown', () => {
                this.travelTo(route);
            });

            container.add([panel, label, meta]);
            container.setDepth(24);
            this.routeButtons.push(container);
        });
    }

    private travelTo (route: Route)
    {
        if (this.isTraveling || this.eventPanel)
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

        this.clearRouteButtons();
        this.locationText.setText(`前往 ${target.name}`);
        this.subtitleText.setText(route.travelText);
        this.descriptionText.setText('风景在身后退去，旅人没有回头。');
        this.logText.setText(route.travelText);
    }

    private finishTravel ()
    {
        if (!this.pendingRoute)
        {
            return;
        }

        const targetId = this.pendingRoute.target;
        const location = LOCATIONS[targetId];

        this.state.currentLocationId = targetId;
        this.state.visited.add(targetId);
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
        this.clearRouteButtons();
        this.showEventCard(event);
    }

    private showEventCard (event: EventCard)
    {
        const container = this.add.container(0, 0);
        const overlay = this.add.rectangle(512, 384, GAME_WIDTH, GAME_HEIGHT, 0x02050a, 0.62);
        const card = this.add.rectangle(512, EVENT_CARD_Y, 650, 382, 0x0b1620, 0.96);
        const title = this.add.text(512, 235, event.title, {
            fontFamily: UI_FONT,
            fontSize: 30,
            color: '#f1fbff'
        }).setOrigin(0.5);
        const body = this.add.text(512, 304, event.body, {
            fontFamily: UI_FONT,
            fontSize: 19,
            color: '#cad9e2',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        overlay.setInteractive();
        card.setStrokeStyle(1, 0xbed4df, 0.65);
        container.setDepth(42);
        container.add([overlay, card, title, body]);

        event.choices.forEach((choice, index) => {
            const y = EVENT_CHOICE_BASE_Y + (index * EVENT_CHOICE_SPACING);
            const button = this.add.rectangle(512, y, 500, 54, 0x162a3a, 0.96);
            const label = this.add.text(512, y, choice.label, {
                fontFamily: UI_FONT,
                fontSize: 19,
                color: '#eff8ff'
            }).setOrigin(0.5);

            button.setStrokeStyle(1, 0xa9c2d2, 0.72);
            button.setInteractive({ useHandCursor: true });
            button.on('pointerover', () => {
                button.setFillStyle(0x24445b, 0.98);
            });
            button.on('pointerout', () => {
                button.setFillStyle(0x162a3a, 0.96);
            });
            button.on('pointerdown', () => {
                this.resolveEventChoice(event, choice);
            });

            container.add([button, label]);
        });

        this.eventPanel = container;
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: EVENT_FADE_DURATION,
            ease: 'Sine.easeOut'
        });
    }

    private resolveEventChoice (event: EventCard, choice: EventChoice)
    {
        this.state.resolvedEvents.add(event.id);
        this.applyDelta(choice.delta);
        this.closeEventCard();
        this.renderLocation(choice.result);
    }

    private applyDelta (delta: ChoiceDelta)
    {
        if (delta.mood)
        {
            this.state.mood = Math.max(-3, Math.min(5, this.state.mood + delta.mood));
        }

        delta.discoveries?.forEach((discovery) => {
            if (!this.state.discoveries.includes(discovery))
            {
                this.state.discoveries.push(discovery);
            }
        });

        delta.keepsakes?.forEach((keepsake) => {
            if (!this.state.keepsakes.includes(keepsake))
            {
                this.state.keepsakes.push(keepsake);
            }
        });
    }

    private closeEventCard ()
    {
        this.eventPanel?.destroy(true);
        this.eventPanel = null;
    }

    private clearRouteButtons ()
    {
        this.routeButtons.forEach((button) => {
            button.destroy(true);
        });
        this.routeButtons = [];
    }

    private createForestLayers ()
    {
        this.forestLayers = FOREST_LAYER_SPECS.map((spec, layerIndex) => {
            return this.createForestLayer(spec.parallax, spec.span, this.buildForestConfigs(spec, layerIndex));
        });

        this.updateForestLayers();
    }

    private buildForestConfigs (spec: ForestLayerSpec, layerIndex: number): ForestPlacementConfig[]
    {
        const flipIndexes = new Set(spec.flipIndexes ?? []);

        return Array.from({ length: spec.count }, (_, index) => {
            return {
                key: spec.keys[index % spec.keys.length],
                baseX: Math.round(spec.xStart + (index * spec.xSpacing) + this.getForestJitter(spec.xJitter, layerIndex, index, 1)),
                y: Math.round(spec.yBase + this.getForestJitter(spec.yJitter, layerIndex, index, 2)),
                scale: this.roundForestScale(spec.scaleBase + this.getForestJitter(spec.scaleJitter, layerIndex, index, 3)),
                alpha: FOREST_SPRITE_ALPHA,
                depth: spec.depth,
                flipX: flipIndexes.has(index),
                tint: spec.tints?.[index % spec.tints.length],
                tintMode: spec.tintMode,
                blur: spec.blur
            };
        });
    }

    private getForestJitter (range: number, layerIndex: number, spriteIndex: number, salt: number)
    {
        return ((this.getForestRandom(layerIndex, spriteIndex, salt) * 2) - 1) * range;
    }

    private getForestRandom (layerIndex: number, spriteIndex: number, salt: number)
    {
        let value = FOREST_RANDOM_SEED;

        value ^= Math.imul(layerIndex + 1, 0x9e3779b1);
        value ^= Math.imul(spriteIndex + 1, 0x85ebca6b);
        value ^= Math.imul(salt + 1, 0xc2b2ae35);
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d);
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b);
        value ^= value >>> 16;

        return (value >>> 0) / 0xffffffff;
    }

    private roundForestScale (scale: number)
    {
        return Math.round(scale * 1000) / 1000;
    }

    private createForestLayer (
        parallax: number,
        span: number,
        configs: ForestPlacementConfig[]
    ): ForestLayer
    {
        const sprites = configs.map((config) => {
            const image = this.add.image(config.baseX, config.y, config.key);

            image.setOrigin(0.5, 1);
            image.setScale(config.scale);
            image.setAlpha(config.alpha);
            image.setDepth(config.depth);

            if (config.flipX)
            {
                image.setFlipX(true);
            }

            if (config.tint)
            {
                image.setTint(config.tint);
            }

            if (config.tintMode !== undefined)
            {
                image.setTintMode(config.tintMode);
            }

            if (config.blur)
            {
                image.enableFilters();
                image.filters?.internal.addBlur(0, 2, 2, 0.7, 0x061018, 3);
            }

            return { ...config, image };
        });

        return { parallax, span, sprites };
    }

    private updateForestLayers ()
    {
        this.forestLayers.forEach((layer) => {
            layer.sprites.forEach((sprite) => {
                const rawX = sprite.baseX - (this.worldOffset * layer.parallax);

                sprite.image.x = this.wrapForestX(rawX, layer.span, 520);
            });
        });
    }

    private wrapForestX (x: number, span: number, buffer: number)
    {
        const wrapped = ((((x + buffer) % span) + span) % span) - buffer;

        return wrapped;
    }

    private applyParallax ()
    {
        this.vista.tilePositionX = this.worldOffset * VISTA_PARALLAX;
        this.roadLayer.tilePositionX = this.worldOffset * ROAD_PARALLAX;
        this.updateForestLayers();
    }

    private animateTraveler (time: number)
    {
        const step = this.isTraveling ? Math.sin(time / TRAVELER_BOB_PERIOD_FAST) : Math.sin(time / TRAVELER_BOB_PERIOD_SLOW);

        this.traveler.y = TRAVELER_Y + (this.isTraveling ? step * TRAVELER_BOB_AMP_TRAVEL : step * TRAVELER_BOB_AMP_IDLE);
        this.traveler.rotation = this.isTraveling ? Math.sin(time / TRAVELER_ROT_PERIOD_FAST) * TRAVELER_ROT_AMP_TRAVEL : Math.sin(time / TRAVELER_ROT_PERIOD_SLOW) * TRAVELER_ROT_AMP_IDLE;
    }

    private getMoodLabel ()
    {
        if (this.state.mood <= -2)
        {
            return '低回';
        }

        if (this.state.mood <= 0)
        {
            return '沉静';
        }

        if (this.state.mood <= 2)
        {
            return '微亮';
        }

        return '轻盈';
    }

    private easeInOutSine (progress: number)
    {
        return -(Math.cos(Math.PI * progress) - 1) / 2;
    }

    private createParallaxTextures ()
    {
        this.createTexture('road-strip', 1024, ROAD_HEIGHT, (graphics) => {
            graphics.fillStyle(0x111821, 0.96);
            graphics.fillRect(0, 0, 1024, ROAD_HEIGHT);

            graphics.fillStyle(0x25313b, 0.78);
            graphics.fillRect(0, 8, 1024, 16);

            graphics.lineStyle(1, 0x596879, 0.32);
            for (let x = -20; x < 1040; x += 86)
            {
                graphics.lineBetween(x, 18, x + 62, 14);
            }

            graphics.fillStyle(0x5c6972, 0.42);
            for (let x = 18; x < 1024; x += 112)
            {
                graphics.fillEllipse(x, 14 + ((x / 28) % 2) * 8, 18, 5);
                graphics.fillEllipse(x + 48, 24, 24, 5);
            }

            graphics.fillStyle(0x05090f, 0.42);
            graphics.fillRect(0, 30, 1024, 10);
        });
    }

    private createTexture (
        key: string,
        width: number,
        height: number,
        draw: (graphics: GameObjects.Graphics) => void
    )
    {
        if (this.textures.exists(key))
        {
            return;
        }

        const graphics = this.add.graphics();

        draw(graphics);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }
}
