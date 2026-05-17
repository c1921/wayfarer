import { GameObjects, Scene } from 'phaser';
import { ROAD_HEIGHT } from '../config';

export const createParallaxTextures = (scene: Scene) => {
    createTexture(scene, 'road-strip', 1024, ROAD_HEIGHT, (graphics) => {
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
};

const createTexture = (
    scene: Scene,
    key: string,
    width: number,
    height: number,
    draw: (graphics: GameObjects.Graphics) => void
) => {
    if (scene.textures.exists(key))
    {
        return;
    }

    const graphics = scene.add.graphics();

    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
};
