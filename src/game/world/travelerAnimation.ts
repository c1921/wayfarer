import type { GameObjects } from 'phaser';
import {
    TRAVELER_BOB_AMP_IDLE,
    TRAVELER_BOB_AMP_TRAVEL,
    TRAVELER_BOB_PERIOD_FAST,
    TRAVELER_BOB_PERIOD_SLOW,
    TRAVELER_ROT_AMP_IDLE,
    TRAVELER_ROT_AMP_TRAVEL,
    TRAVELER_ROT_PERIOD_FAST,
    TRAVELER_ROT_PERIOD_SLOW,
    TRAVELER_Y
} from '../config';

export const animateTraveler = (traveler: GameObjects.Image, time: number, isTraveling: boolean) => {
    const step = isTraveling
        ? Math.sin(time / TRAVELER_BOB_PERIOD_FAST)
        : Math.sin(time / TRAVELER_BOB_PERIOD_SLOW);

    traveler.y = TRAVELER_Y + (isTraveling ? step * TRAVELER_BOB_AMP_TRAVEL : step * TRAVELER_BOB_AMP_IDLE);
    traveler.rotation = isTraveling
        ? Math.sin(time / TRAVELER_ROT_PERIOD_FAST) * TRAVELER_ROT_AMP_TRAVEL
        : Math.sin(time / TRAVELER_ROT_PERIOD_SLOW) * TRAVELER_ROT_AMP_IDLE;
};

export const easeInOutSine = (progress: number) => {
    return -(Math.cos(Math.PI * progress) - 1) / 2;
};
