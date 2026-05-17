import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.add.image(512, 384, 'background-vista').setDisplaySize(1024, 768);

        this.add.rectangle(512, 384, 468, 32, 0x07111c, 0.65).setStrokeStyle(1, 0xd8e7f0, 0.85);

        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xd8e7f0);

        this.load.on('progress', (progress: number) => {

            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        this.load.setPath('assets/wayfarer');

        this.load.image('traveler', 'traveler.png');
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
