import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.image('background-vista', 'assets/wayfarer/background-vista.png');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
