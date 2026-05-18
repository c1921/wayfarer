import { Scene } from 'phaser';
import {
    TRAVELER_WALK_ANIMATION_KEY,
    TRAVELER_WALK_FRAME_COUNT,
    TRAVELER_WALK_FRAME_KEY_PREFIX,
    TRAVELER_WALK_FRAME_RATE
} from '../config';

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

        for (let frame = 1; frame <= TRAVELER_WALK_FRAME_COUNT; frame++)
        {
            const frameName = frame.toString().padStart(4, '0');

            this.load.image(`${TRAVELER_WALK_FRAME_KEY_PREFIX}${frameName}`, `traveler-walk/${frameName}.png`);
        }

        this.load.image('forest-far-pines-a', 'forest/forest-far-pines-a.png');
        this.load.image('forest-far-pines-b', 'forest/forest-far-pines-b.png');
        this.load.image('forest-mid-pine-a', 'forest/forest-mid-pine-a.png');
        this.load.image('forest-mid-pine-b', 'forest/forest-mid-pine-b.png');
        this.load.image('forest-bush-a', 'forest/forest-bush-a.png');
        this.load.image('forest-bush-b', 'forest/forest-bush-b.png');
    }

    create ()
    {
        if (!this.anims.exists(TRAVELER_WALK_ANIMATION_KEY))
        {
            this.anims.create({
                key: TRAVELER_WALK_ANIMATION_KEY,
                frames: Array.from({ length: TRAVELER_WALK_FRAME_COUNT }, (_, index) => ({
                    key: `${TRAVELER_WALK_FRAME_KEY_PREFIX}${(index + 1).toString().padStart(4, '0')}`
                })),
                frameRate: TRAVELER_WALK_FRAME_RATE,
                repeat: -1
            });
        }

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
