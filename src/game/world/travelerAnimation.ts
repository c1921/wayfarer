import type { GameObjects } from 'phaser';
import {
    TRAVELER_WALK_ANIMATION_KEY,
    TRAVELER_WALK_IDLE_FRAME_KEY
} from '../config';

export const animateTraveler = (traveler: GameObjects.Sprite, isTraveling: boolean) => {
    if (isTraveling)
    {
        if (!traveler.anims.isPlaying || traveler.anims.currentAnim?.key !== TRAVELER_WALK_ANIMATION_KEY)
        {
            traveler.play(TRAVELER_WALK_ANIMATION_KEY);
        }

        return;
    }

    if (traveler.anims.isPlaying)
    {
        traveler.stop();
    }

    if (traveler.texture.key !== TRAVELER_WALK_IDLE_FRAME_KEY)
    {
        traveler.setTexture(TRAVELER_WALK_IDLE_FRAME_KEY);
    }
};

export const easeInOutSine = (progress: number) => {
    return -(Math.cos(Math.PI * progress) - 1) / 2;
};
