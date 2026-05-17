import { GameObjects, Scene } from 'phaser';
import {
    EVENT_CARD_Y,
    EVENT_CHOICE_BASE_Y,
    EVENT_CHOICE_SPACING,
    EVENT_FADE_DURATION,
    GAME_HEIGHT,
    GAME_WIDTH,
    UI_FONT
} from '../config';
import type { EventCard, EventChoice } from '../journey';

type EventChoiceHandler = (event: EventCard, choice: EventChoice) => void;

export class EventCardOverlay
{
    private eventPanel: GameObjects.Container | null = null;

    constructor (
        private readonly scene: Scene,
        private readonly onSelect: EventChoiceHandler
    )
    {}

    get isOpen ()
    {
        return this.eventPanel !== null;
    }

    show (event: EventCard)
    {
        this.close();

        const container = this.scene.add.container(0, 0);
        const overlay = this.scene.add.rectangle(512, 384, GAME_WIDTH, GAME_HEIGHT, 0x02050a, 0.62);
        const card = this.scene.add.rectangle(512, EVENT_CARD_Y, 650, 382, 0x0b1620, 0.96);
        const title = this.scene.add.text(512, 235, event.title, {
            fontFamily: UI_FONT,
            fontSize: 30,
            color: '#f1fbff'
        }).setOrigin(0.5);
        const body = this.scene.add.text(512, 304, event.body, {
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
            const button = this.scene.add.rectangle(512, y, 500, 54, 0x162a3a, 0.96);
            const label = this.scene.add.text(512, y, choice.label, {
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
                this.onSelect(event, choice);
            });

            container.add([button, label]);
        });

        this.eventPanel = container;
        container.setAlpha(0);
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            duration: EVENT_FADE_DURATION,
            ease: 'Sine.easeOut'
        });
    }

    close ()
    {
        this.eventPanel?.destroy(true);
        this.eventPanel = null;
    }
}
