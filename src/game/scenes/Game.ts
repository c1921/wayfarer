import { GameObjects, Scene } from 'phaser';
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
const UI_FONT = 'Microsoft YaHei, SimHei, Arial';

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

export class Game extends Scene
{
    private vista: GameObjects.TileSprite;
    private farLayer: GameObjects.TileSprite;
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

        this.add.rectangle(512, 384, GAME_WIDTH, GAME_HEIGHT, 0x07111c, 0.18).setDepth(1);

        this.farLayer = this.add.tileSprite(512, 355, GAME_WIDTH, 330, 'far-mountains');
        this.farLayer.setAlpha(0.6);
        this.farLayer.setDepth(2);

        this.createForestLayers();

        this.roadLayer = this.add.tileSprite(512, 668, GAME_WIDTH, 220, 'road-strip');
        this.roadLayer.setDepth(4);

        this.add.ellipse(292, 674, 178, 26, 0x020407, 0.42).setDepth(5);

        this.traveler = this.add.image(296, 670, 'traveler');
        this.traveler.setOrigin(0.5, 1);
        this.traveler.setScale(0.22);
        this.traveler.setDepth(6);

        this.add.rectangle(512, 720, GAME_WIDTH, 96, 0x02060a, 0.3).setDepth(4.5);
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
            const container = this.add.container(x, 708);
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
        this.travelDuration = 2200 + Math.round(route.distance * 0.45);
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

        this.time.delayedCall(220, () => {
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
        const card = this.add.rectangle(512, 382, 650, 382, 0x0b1620, 0.96);
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
            const y = 410 + (index * 72);
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
            duration: 160,
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
        this.forestLayers = [
            this.createForestLayer(0.2, 1680, [
                { key: 'forest-far-pines-a', baseX: 90, y: 590, scale: 0.24, alpha: 0.46, depth: 2.6, tint: 0x91a4bd },
                { key: 'forest-far-pines-b', baseX: 690, y: 594, scale: 0.23, alpha: 0.42, depth: 2.6, tint: 0x8096ae },
                { key: 'forest-far-pines-a', baseX: 1240, y: 588, scale: 0.2, alpha: 0.38, depth: 2.6, flipX: true, tint: 0x7c8fa5 }
            ]),
            this.createForestLayer(0.5, 1820, [
                { key: 'forest-mid-pine-a', baseX: -80, y: 675, scale: 0.27, alpha: 0.82, depth: 3.15, tint: 0xb2c4dc },
                { key: 'forest-mid-pine-b', baseX: 250, y: 672, scale: 0.24, alpha: 0.72, depth: 3.1, tint: 0x9eb1ca },
                { key: 'forest-mid-pine-a', baseX: 620, y: 682, scale: 0.31, alpha: 0.78, depth: 3.2, flipX: true, tint: 0xa7bad2 },
                { key: 'forest-mid-pine-b', baseX: 990, y: 674, scale: 0.27, alpha: 0.76, depth: 3.15, flipX: true, tint: 0xa0b5cc },
                { key: 'forest-mid-pine-a', baseX: 1370, y: 678, scale: 0.25, alpha: 0.7, depth: 3.1, tint: 0x91a5bd }
            ]),
            this.createForestLayer(0.76, 1580, [
                { key: 'forest-bush-a', baseX: -30, y: 724, scale: 0.17, alpha: 0.9, depth: 5.15, tint: 0xb6c7d9 },
                { key: 'forest-bush-b', baseX: 360, y: 726, scale: 0.16, alpha: 0.86, depth: 5.15, flipX: true, tint: 0xaec1d4 },
                { key: 'forest-bush-a', baseX: 780, y: 724, scale: 0.15, alpha: 0.82, depth: 5.15, flipX: true, tint: 0x9fb4c9 },
                { key: 'forest-bush-b', baseX: 1170, y: 726, scale: 0.15, alpha: 0.82, depth: 5.15, tint: 0x9db1c6 }
            ])
        ];

        this.updateForestLayers();
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
        this.vista.tilePositionX = this.worldOffset * 0.16;
        this.farLayer.tilePositionX = this.worldOffset * 0.28;
        this.roadLayer.tilePositionX = this.worldOffset * 0.86;
        this.updateForestLayers();
    }

    private animateTraveler (time: number)
    {
        const step = this.isTraveling ? Math.sin(time / 115) : Math.sin(time / 900);

        this.traveler.y = 670 + (this.isTraveling ? step * 4 : step * 1.4);
        this.traveler.rotation = this.isTraveling ? Math.sin(time / 170) * 0.012 : Math.sin(time / 1200) * 0.004;
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
        this.createTexture('far-mountains', 1024, 330, (graphics) => {
            graphics.fillStyle(0x0d1722, 0.16);
            graphics.fillRect(0, 220, 1024, 110);

            graphics.fillStyle(0x6e8396, 0.25);
            graphics.fillTriangle(-80, 245, 140, 68, 360, 245);
            graphics.fillTriangle(220, 245, 430, 92, 680, 245);
            graphics.fillTriangle(550, 248, 798, 62, 1090, 248);

            graphics.fillStyle(0x2c3e50, 0.34);
            graphics.fillTriangle(-40, 265, 210, 124, 470, 265);
            graphics.fillTriangle(350, 266, 610, 118, 900, 266);
            graphics.fillTriangle(720, 266, 920, 142, 1140, 266);
        });

        this.createTexture('road-strip', 1024, 220, (graphics) => {
            graphics.fillStyle(0x111821, 0.96);
            graphics.fillRect(0, 0, 1024, 220);

            graphics.fillStyle(0x25313b, 0.92);
            graphics.fillTriangle(0, 44, 1024, 14, 1024, 128);
            graphics.fillTriangle(0, 86, 1024, 58, 1024, 176);

            graphics.lineStyle(2, 0x596879, 0.35);
            for (let x = -20; x < 1040; x += 82)
            {
                graphics.lineBetween(x, 72, x + 64, 62);
                graphics.lineBetween(x + 12, 128, x + 92, 112);
            }

            graphics.fillStyle(0x5c6972, 0.42);
            for (let x = 18; x < 1024; x += 96)
            {
                graphics.fillEllipse(x, 40 + ((x / 24) % 5) * 20, 22, 8);
                graphics.fillEllipse(x + 44, 122 + ((x / 32) % 3) * 18, 30, 9);
            }

            graphics.fillStyle(0x05090f, 0.42);
            graphics.fillRect(0, 174, 1024, 46);
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
