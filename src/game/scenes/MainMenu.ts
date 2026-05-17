import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    title: GameObjects.Text;
    subtitle: GameObjects.Text;
    startButton: GameObjects.Rectangle;
    startText: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background-vista');
        this.background.setDisplaySize(1024, 768);
        this.background.setTint(0x9fb4c8);

        this.add.rectangle(512, 384, 1024, 768, 0x030811, 0.38);

        this.title = this.add.text(512, 256, '远行者', {
            fontFamily: 'Microsoft YaHei, SimHei, Arial',
            fontSize: 74,
            color: '#edf6fb',
            stroke: '#07111c',
            strokeThickness: 7,
            align: 'center'
        }).setOrigin(0.5);

        this.subtitle = this.add.text(512, 334, 'Wayfarer', {
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 30,
            color: '#b8cad8',
            align: 'center'
        }).setOrigin(0.5);

        this.startButton = this.add.rectangle(512, 488, 190, 58, 0x132332, 0.9);
        this.startButton.setStrokeStyle(1, 0xaec2cf, 0.9);
        this.startButton.setInteractive({ useHandCursor: true });

        this.startText = this.add.text(512, 488, '启程', {
            fontFamily: 'Microsoft YaHei, SimHei, Arial',
            fontSize: 24,
            color: '#eff8ff'
        }).setOrigin(0.5);

        this.startButton.on('pointerover', () => {
            this.startButton.setFillStyle(0x20384c, 0.95);
        });

        this.startButton.on('pointerout', () => {
            this.startButton.setFillStyle(0x132332, 0.9);
        });

        this.startButton.once('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
