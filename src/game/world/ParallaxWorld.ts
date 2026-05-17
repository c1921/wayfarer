import { GameObjects, Scene } from 'phaser';
import {
    GAME_HEIGHT,
    GAME_WIDTH,
    ROAD_HEIGHT,
    ROAD_PARALLAX,
    ROAD_Y,
    TRAVELER_SCALE,
    TRAVELER_SHADOW_HEIGHT,
    TRAVELER_SHADOW_WIDTH,
    TRAVELER_SHADOW_X,
    TRAVELER_SHADOW_Y,
    TRAVELER_X,
    TRAVELER_Y,
    VIGNETTE_ALPHA,
    VISTA_PARALLAX
} from '../config';
import { animateTraveler } from './travelerAnimation';
import { createForestLayers, type StreamingForestLayer, updateForestLayers } from './forest';
import { createParallaxTextures } from './textures';

export class ParallaxWorld
{
    private vista: GameObjects.TileSprite;
    private roadLayer: GameObjects.TileSprite;
    private traveler: GameObjects.Image;
    private forestLayers: StreamingForestLayer[] = [];

    constructor (scene: Scene, initialWorldOffset: number)
    {
        createParallaxTextures(scene);

        this.vista = scene.add.tileSprite(512, 384, GAME_WIDTH, GAME_HEIGHT, 'background-vista');
        this.vista.setDepth(0);
        this.vista.setTileScale(0.86, 0.86);
        this.vista.tilePositionY = 38;

        scene.add.rectangle(512, 384, GAME_WIDTH, GAME_HEIGHT, 0x07111c, VIGNETTE_ALPHA).setDepth(1);

        this.forestLayers = createForestLayers(scene);

        this.roadLayer = scene.add.tileSprite(512, ROAD_Y, GAME_WIDTH, ROAD_HEIGHT, 'road-strip');
        this.roadLayer.setDepth(3.5);

        scene.add.ellipse(TRAVELER_SHADOW_X, TRAVELER_SHADOW_Y, TRAVELER_SHADOW_WIDTH, TRAVELER_SHADOW_HEIGHT, 0x020407, 0.46).setDepth(3.8);

        this.traveler = scene.add.image(TRAVELER_X, TRAVELER_Y, 'traveler');
        this.traveler.setOrigin(0.5, 1);
        this.traveler.setScale(TRAVELER_SCALE);
        this.traveler.setDepth(5.5);

        scene.add.rectangle(512, (ROAD_Y + GAME_HEIGHT) / 2, GAME_WIDTH, GAME_HEIGHT - ROAD_Y, 0x000000, 1).setDepth(3.0);

        this.applyParallax(initialWorldOffset);
    }

    update (worldOffset: number, isTraveling: boolean, time: number)
    {
        this.applyParallax(worldOffset);
        animateTraveler(this.traveler, time, isTraveling);
    }

    private applyParallax (worldOffset: number)
    {
        this.vista.tilePositionX = worldOffset * VISTA_PARALLAX;
        this.roadLayer.tilePositionX = worldOffset * ROAD_PARALLAX;
        updateForestLayers(this.forestLayers, worldOffset);
    }
}
