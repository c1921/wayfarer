import { GameObjects, Scene } from 'phaser';
import { ROUTE_BUTTON_Y, UI_FONT } from '../config';
import { LOCATIONS, type JourneyState, type Route } from '../journey';

type RouteSelectHandler = (route: Route) => void;

export class RouteButtons
{
    private buttons: GameObjects.Container[] = [];

    constructor (
        private readonly scene: Scene,
        private readonly onSelect: RouteSelectHandler
    )
    {}

    show (routes: Route[], state: JourneyState)
    {
        const spacing = 292;
        const baseX = 512 - ((routes.length - 1) * spacing / 2);

        this.clear();

        routes.forEach((route, index) => {
            const target = LOCATIONS[route.target];
            const visitedText = state.visited.has(route.target) ? '已走过的路' : '未抵达';
            const x = baseX + (index * spacing);
            const container = this.scene.add.container(x, ROUTE_BUTTON_Y);
            const panel = this.scene.add.rectangle(0, 0, 258, 62, 0x122333, 0.94);
            const label = this.scene.add.text(0, -12, target.name, {
                fontFamily: UI_FONT,
                fontSize: 21,
                color: '#f2fbff'
            }).setOrigin(0.5);
            const meta = this.scene.add.text(0, 16, visitedText, {
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
                this.onSelect(route);
            });

            container.add([panel, label, meta]);
            container.setDepth(24);
            this.buttons.push(container);
        });
    }

    clear ()
    {
        this.buttons.forEach((button) => {
            button.destroy(true);
        });
        this.buttons = [];
    }
}
