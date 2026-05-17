import { GameObjects, Scene, TintModes } from 'phaser';

interface ForestPlacementConfig
{
    key: string;
    baseX: number;
    y: number;
    scale: number;
    alpha: number;
    depth: number;
    flipX?: boolean;
    tint?: number;
    tintMode?: number;
    blur?: boolean;
}

interface ForestSprite extends ForestPlacementConfig
{
    image: GameObjects.Image;
}

export interface ForestLayer
{
    parallax: number;
    span: number;
    sprites: ForestSprite[];
}

interface ForestLayerSpec
{
    parallax: number;
    span: number;
    count: number;
    keys: string[];
    xStart: number;
    xSpacing: number;
    xJitter: number;
    yBase: number;
    yJitter: number;
    scaleBase: number;
    scaleJitter: number;
    depth: number;
    tints?: number[];
    flipIndexes?: number[];
    tintMode?: number;
    blur?: boolean;
}

const FOREST_RANDOM_SEED = 83721;
const FOREST_SPRITE_ALPHA = 1;
const FOREST_WRAP_BUFFER = 520;

const FOREST_LAYER_SPECS: ForestLayerSpec[] = [
    {
        parallax: 0.2,
        span: 1680,
        count: 7,
        keys: ['forest-far-pines-a', 'forest-far-pines-b'],
        xStart: 0,
        xSpacing: 240,
        xJitter: 22,
        yBase: 666,
        yJitter: 12,
        scaleBase: 0.38,
        scaleJitter: 0.04,
        depth: 2.6,
        tints: [0x91a4bd, 0x8096ae, 0x7c8fa5, 0x879bb2, 0x8296ad, 0x788ca3, 0x8da1b8],
        flipIndexes: [2, 3, 6]
    },
    {
        parallax: 0.5,
        span: 1820,
        count: 10,
        keys: ['forest-mid-pine-a', 'forest-mid-pine-b'],
        xStart: 0,
        xSpacing: 180,
        xJitter: 18,
        yBase: 700,
        yJitter: 21,
        scaleBase: 0.8,
        scaleJitter: 0.05,
        depth: 4.0,
        tints: [0xb2c4dc, 0x9eb1ca, 0xa7bad2, 0xa0b5cc, 0x91a5bd, 0xa8b9cf, 0xb0c1d8, 0x9badc4, 0xa1b4cc, 0x94a8c0],
        flipIndexes: [2, 3, 6, 7]
    },
    {
        parallax: 0.56,
        span: 1640,
        count: 8,
        keys: ['forest-bush-a', 'forest-bush-b'],
        xStart: 40,
        xSpacing: 210,
        xJitter: 16,
        yBase: 700,
        yJitter: 10,
        scaleBase: 0.24,
        scaleJitter: 0.02,
        depth: 4.3,
        tints: [0x94a7bc, 0x8498ae, 0x9badc2, 0x889cb2, 0x90a4bb, 0x8195ac, 0x8fa3b9, 0x879bb1],
        flipIndexes: [1, 2, 5, 6]
    },
    {
        parallax: 0.76,
        span: 1580,
        count: 9,
        keys: ['forest-bush-a', 'forest-bush-b'],
        xStart: 0,
        xSpacing: 175,
        xJitter: 14,
        yBase: 774,
        yJitter: 12,
        scaleBase: 0.30,
        scaleJitter: 0.1,
        depth: 6.5,
        tints: [0x061018],
        flipIndexes: [1, 2, 5, 6],
        tintMode: TintModes.FILL,
        blur: true
    }
];

export const createForestLayers = (scene: Scene): ForestLayer[] => {
    return FOREST_LAYER_SPECS.map((spec, layerIndex) => {
        return createForestLayer(scene, spec.parallax, spec.span, buildForestConfigs(spec, layerIndex));
    });
};

export const updateForestLayers = (layers: ForestLayer[], worldOffset: number) => {
    layers.forEach((layer) => {
        layer.sprites.forEach((sprite) => {
            const rawX = sprite.baseX - (worldOffset * layer.parallax);

            sprite.image.x = wrapForestX(rawX, layer.span, FOREST_WRAP_BUFFER);
        });
    });
};

const buildForestConfigs = (spec: ForestLayerSpec, layerIndex: number): ForestPlacementConfig[] => {
    const flipIndexes = new Set(spec.flipIndexes ?? []);

    return Array.from({ length: spec.count }, (_, index) => {
        return {
            key: spec.keys[index % spec.keys.length],
            baseX: Math.round(spec.xStart + (index * spec.xSpacing) + getForestJitter(spec.xJitter, layerIndex, index, 1)),
            y: Math.round(spec.yBase + getForestJitter(spec.yJitter, layerIndex, index, 2)),
            scale: roundForestScale(spec.scaleBase + getForestJitter(spec.scaleJitter, layerIndex, index, 3)),
            alpha: FOREST_SPRITE_ALPHA,
            depth: spec.depth,
            flipX: flipIndexes.has(index),
            tint: spec.tints?.[index % spec.tints.length],
            tintMode: spec.tintMode,
            blur: spec.blur
        };
    });
};

const createForestLayer = (
    scene: Scene,
    parallax: number,
    span: number,
    configs: ForestPlacementConfig[]
): ForestLayer => {
    const sprites = configs.map((config) => {
        const image = scene.add.image(config.baseX, config.y, config.key);

        image.setOrigin(0.5, 1);
        image.setScale(config.scale);
        image.setAlpha(config.alpha);
        image.setDepth(config.depth);

        if (config.flipX)
        {
            image.setFlipX(true);
        }

        if (config.tint !== undefined)
        {
            image.setTint(config.tint);
        }

        if (config.tintMode !== undefined)
        {
            image.setTintMode(config.tintMode);
        }

        if (config.blur)
        {
            image.enableFilters();
            image.filters?.internal.addBlur(0, 2, 2, 0.7, 0x061018, 3);
        }

        return { ...config, image };
    });

    return { parallax, span, sprites };
};

const getForestJitter = (range: number, layerIndex: number, spriteIndex: number, salt: number) => {
    return ((getForestRandom(layerIndex, spriteIndex, salt) * 2) - 1) * range;
};

const getForestRandom = (layerIndex: number, spriteIndex: number, salt: number) => {
    let value = FOREST_RANDOM_SEED;

    value ^= Math.imul(layerIndex + 1, 0x9e3779b1);
    value ^= Math.imul(spriteIndex + 1, 0x85ebca6b);
    value ^= Math.imul(salt + 1, 0xc2b2ae35);
    value ^= value >>> 16;
    value = Math.imul(value, 0x7feb352d);
    value ^= value >>> 15;
    value = Math.imul(value, 0x846ca68b);
    value ^= value >>> 16;

    return (value >>> 0) / 0xffffffff;
};

const roundForestScale = (scale: number) => {
    return Math.round(scale * 1000) / 1000;
};

const wrapForestX = (x: number, span: number, buffer: number) => {
    return ((((x + buffer) % span) + span) % span) - buffer;
};
