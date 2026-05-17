import { GameObjects, Scene, TintModes } from 'phaser';
import { GAME_WIDTH } from '../config';

// ---- constants ----

const FOREST_RANDOM_SEED = 83721;
const FOREST_SPRITE_ALPHA = 1;
const FOREST_WRAP_BUFFER = 520;

// ---- interfaces ----

interface TintRange
{
    baseR: number;
    baseG: number;
    baseB: number;
    rangeR: number;
    rangeG: number;
    rangeB: number;
}

interface ForestLayerSpec
{
    parallax: number;
    keys: string[];
    xStart: number;
    xSpacing: number;
    xJitter: number;
    yBase: number;
    yJitter: number;
    scaleBase: number;
    scaleJitter: number;
    depth: number;
    tintRange?: TintRange;
    tintMode?: number;
    blur?: boolean;
}

interface ForestSpriteState
{
    slot: number;
    worldX: number;
    y: number;
    scale: number;
    key: string;
    flipX: boolean;
    tint: number | undefined;
    tintMode: number | undefined;
    blur: boolean;
}

export interface StreamingForestLayer
{
    parallax: number;
    pool: GameObjects.Group;
    spec: ForestLayerSpec;
    layerIndex: number;
    slotToSprite: Map<number, GameObjects.Image>;
    pendingSlots: Set<number>;
    minActiveSlot: number;
    maxActiveSlot: number;
}

// ---- deterministic PRNG ----

const getForestRandom = (layerIndex: number, slot: number, salt: number): number =>
{
    let value = FOREST_RANDOM_SEED;

    value ^= Math.imul(layerIndex + 1, 0x9e3779b1);
    value ^= Math.imul(slot + 1, 0x85ebca6b);
    value ^= Math.imul(salt + 1, 0xc2b2ae35);
    value ^= value >>> 16;
    value = Math.imul(value, 0x7feb352d);
    value ^= value >>> 15;
    value = Math.imul(value, 0x846ca68b);
    value ^= value >>> 16;

    return (value >>> 0) / 0xffffffff;
};

const getForestJitter = (range: number, layerIndex: number, slot: number, salt: number): number =>
{
    return ((getForestRandom(layerIndex, slot, salt) * 2) - 1) * range;
};

// ---- tint ----

const clampChannel = (v: number): number =>
{
    return Math.max(0, Math.min(255, Math.round(v)));
};

const computeTint = (slot: number, layerIndex: number, range: TintRange): number =>
{
    const r = clampChannel(range.baseR + getForestJitter(range.rangeR, layerIndex, slot, 4));
    const g = clampChannel(range.baseG + getForestJitter(range.rangeG, layerIndex, slot, 5));
    const b = clampChannel(range.baseB + getForestJitter(range.rangeB, layerIndex, slot, 6));

    return (r << 16) | (g << 8) | b;
};

// ---- material sequence ----

const resolveMaterial = (slot: number, keys: string[]): { key: string; flipX: boolean } =>
{
    const cycleLen = keys.length * 2;
    const idx = ((slot % cycleLen) + cycleLen) % cycleLen;
    const flipX = idx >= keys.length;
    const keyIdx = flipX ? idx - keys.length : idx;

    return { key: keys[keyIdx], flipX };
};

// ---- slot state computation ----

const computeSlotWorldX = (slot: number, spec: ForestLayerSpec, layerIndex: number): number =>
{
    return Math.round(spec.xStart + slot * spec.xSpacing + getForestJitter(spec.xJitter, layerIndex, slot, 1));
};

const computeSlotState = (slot: number, spec: ForestLayerSpec, layerIndex: number): ForestSpriteState =>
{
    const material = resolveMaterial(slot, spec.keys);

    return {
        slot,
        worldX: computeSlotWorldX(slot, spec, layerIndex),
        y: Math.round(spec.yBase + getForestJitter(spec.yJitter, layerIndex, slot, 2)),
        scale: Math.round((spec.scaleBase + getForestJitter(spec.scaleJitter, layerIndex, slot, 3)) * 1000) / 1000,
        key: material.key,
        flipX: material.flipX,
        tint: spec.tintRange ? computeTint(slot, layerIndex, spec.tintRange) : undefined,
        tintMode: spec.tintMode,
        blur: spec.blur ?? false
    };
};

// ---- layer specifications ----

const FOREST_LAYER_SPECS: ForestLayerSpec[] = [
    {
        parallax: 0.2,
        keys: ['forest-far-pines-a', 'forest-far-pines-b'],
        xStart: 0,
        xSpacing: 240,
        xJitter: 22,
        yBase: 666,
        yJitter: 12,
        scaleBase: 0.38,
        scaleJitter: 0.04,
        depth: 2.6,
        tintRange: { baseR: 133, baseG: 152, baseB: 176, rangeR: 13, rangeG: 12, rangeB: 13 }
    },
    {
        parallax: 0.5,
        keys: ['forest-mid-pine-a', 'forest-mid-pine-b'],
        xStart: 0,
        xSpacing: 180,
        xJitter: 18,
        yBase: 700,
        yJitter: 21,
        scaleBase: 0.8,
        scaleJitter: 0.05,
        depth: 4.0,
        tintRange: { baseR: 162, baseG: 181, baseB: 205, rangeR: 17, rangeG: 16, rangeB: 16 }
    },
    {
        parallax: 0.56,
        keys: ['forest-bush-a', 'forest-bush-b'],
        xStart: 40,
        xSpacing: 210,
        xJitter: 16,
        yBase: 700,
        yJitter: 10,
        scaleBase: 0.24,
        scaleJitter: 0.02,
        depth: 4.3,
        tintRange: { baseR: 142, baseG: 161, baseB: 183, rangeR: 13, rangeG: 12, rangeB: 11 }
    },
    {
        parallax: 0.76,
        keys: ['forest-bush-a', 'forest-bush-b'],
        xStart: 0,
        xSpacing: 175,
        xJitter: 14,
        yBase: 774,
        yJitter: 12,
        scaleBase: 0.30,
        scaleJitter: 0.1,
        depth: 6.5,
        tintRange: { baseR: 6, baseG: 16, baseB: 24, rangeR: 2, rangeG: 3, rangeB: 4 },
        tintMode: TintModes.FILL,
        blur: true
    }
];

// ---- pool ----

const computePoolSize = (spec: ForestLayerSpec): number =>
{
    const minSpacing = spec.xSpacing - spec.xJitter;
    const visibleWidth = GAME_WIDTH + 2 * FOREST_WRAP_BUFFER;

    return Math.ceil(visibleWidth / minSpacing) + 4;
};

// ---- create ----

export const createForestLayers = (scene: Scene): StreamingForestLayer[] =>
{
    return FOREST_LAYER_SPECS.map((spec, layerIndex) =>
    {
        const poolSize = computePoolSize(spec);
        const pool = new GameObjects.Group(scene, {
            classType: GameObjects.Image,
            maxSize: poolSize,
            active: false,
            runChildUpdate: false
        });

        return {
            parallax: spec.parallax,
            pool,
            spec,
            layerIndex,
            slotToSprite: new Map(),
            pendingSlots: new Set(),
            minActiveSlot: Number.MAX_SAFE_INTEGER,
            maxActiveSlot: Number.MIN_SAFE_INTEGER
        };
    });
};

// ---- sprite configuration ----

const configureSprite = (sprite: GameObjects.Image, state: ForestSpriteState, spec: ForestLayerSpec): void =>
{
    sprite.setScale(state.scale);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(spec.depth);
    sprite.setAlpha(FOREST_SPRITE_ALPHA);
    sprite.setFlipX(state.flipX);

    if (state.tint !== undefined)
    {
        sprite.setTint(state.tint);
    }

    if (state.tintMode !== undefined)
    {
        sprite.setTintMode(state.tintMode);
    }

    if (state.blur && !sprite.getData('blurReady'))
    {
        sprite.enableFilters();
        sprite.filters?.internal.addBlur(0, 2, 2, 0.7, 0x061018, 3);
        sprite.setData('blurReady', true);
    }

    sprite.setData('slot', state.slot);
};

// ---- activation / deactivation ----

const activateSlot = (layer: StreamingForestLayer, slot: number, worldOffset: number): void =>
{
    const state = computeSlotState(slot, layer.spec, layer.layerIndex);
    const screenX = state.worldX - worldOffset * layer.parallax;
    const sprite = layer.pool.get(screenX, state.y, state.key) as GameObjects.Image | null;

    if (!sprite)
    {
        layer.pendingSlots.add(slot);
        return;
    }

    configureSprite(sprite, state, layer.spec);
    sprite.setActive(true);
    sprite.setVisible(true);
    layer.slotToSprite.set(slot, sprite);
    layer.pendingSlots.delete(slot);
};

const deactivateSlot = (layer: StreamingForestLayer, slot: number): void =>
{
    const sprite = layer.slotToSprite.get(slot);

    if (sprite)
    {
        layer.pool.killAndHide(sprite);
        layer.slotToSprite.delete(slot);
    }
};

// ---- position update ----

const updateActiveSpritePositions = (layer: StreamingForestLayer, worldOffset: number): void =>
{
    for (const [slot, sprite] of layer.slotToSprite)
    {
        sprite.x = computeSlotWorldX(slot, layer.spec, layer.layerIndex) - worldOffset * layer.parallax;
    }
};

// ---- streaming core ----

const isColdStart = (layer: StreamingForestLayer): boolean =>
{
    return layer.minActiveSlot > layer.maxActiveSlot;
};

const fullActivate = (layer: StreamingForestLayer, minSlot: number, maxSlot: number, worldOffset: number): void =>
{
    const currentSlots = [...layer.slotToSprite.keys()];

    for (const slot of currentSlots)
    {
        deactivateSlot(layer, slot);
    }

    for (let s = minSlot; s <= maxSlot; s++)
    {
        activateSlot(layer, s, worldOffset);
    }

    layer.minActiveSlot = minSlot;
    layer.maxActiveSlot = maxSlot;
};

const streamForestLayer = (layer: StreamingForestLayer, worldOffset: number): void =>
{
    const paraOffset = worldOffset * layer.parallax;
    const visibleMin = paraOffset - FOREST_WRAP_BUFFER;
    const visibleMax = paraOffset + GAME_WIDTH + FOREST_WRAP_BUFFER;

    const spec = layer.spec;
    const requiredMinSlot = Math.floor((visibleMin - spec.xStart) / spec.xSpacing) - 1;
    const requiredMaxSlot = Math.ceil((visibleMax - spec.xStart) / spec.xSpacing) + 1;

    if (isColdStart(layer))
    {
        fullActivate(layer, requiredMinSlot, requiredMaxSlot, worldOffset);

        return;
    }

    // deactivate at trailing edges
    for (let s = layer.minActiveSlot; s < requiredMinSlot; s++)
    {
        deactivateSlot(layer, s);
    }

    for (let s = requiredMaxSlot + 1; s <= layer.maxActiveSlot; s++)
    {
        deactivateSlot(layer, s);
    }

    // retry previously failed slots that are still in range
    for (const s of layer.pendingSlots)
    {
        if (s >= requiredMinSlot && s <= requiredMaxSlot)
        {
            activateSlot(layer, s, worldOffset);
        }
    }

    // activate at leading edges
    for (let s = requiredMinSlot; s < layer.minActiveSlot; s++)
    {
        activateSlot(layer, s, worldOffset);
    }

    for (let s = layer.maxActiveSlot + 1; s <= requiredMaxSlot; s++)
    {
        activateSlot(layer, s, worldOffset);
    }

    layer.minActiveSlot = requiredMinSlot;
    layer.maxActiveSlot = requiredMaxSlot;

    updateActiveSpritePositions(layer, worldOffset);
};

// ---- public API ----

export const updateForestLayers = (layers: StreamingForestLayer[], worldOffset: number): void =>
{
    for (const layer of layers)
    {
        streamForestLayer(layer, worldOffset);
    }
};
