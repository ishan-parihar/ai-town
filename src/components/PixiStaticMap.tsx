import { PixiComponent, applyDefaultProps } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { AnimatedSprite, WorldMap } from '../types/game';
import * as campfire from '../../data/animations/campfire.json';
import * as gentlesparkle from '../../data/animations/gentlesparkle.json';
import * as gentlewaterfall from '../../data/animations/gentlewaterfall.json';
import * as gentlesplash from '../../data/animations/gentlesplash.json';
import * as windmill from '../../data/animations/windmill.json';

const animations = {
  'campfire.json': { spritesheet: campfire, url: '/assets/spritesheets/campfire.png' },
  'gentlesparkle.json': {
    spritesheet: gentlesparkle,
    url: '/assets/spritesheets/gentlesparkle32.png',
  },
  'gentlewaterfall.json': {
    spritesheet: gentlewaterfall,
    url: '/assets/spritesheets/gentlewaterfall32.png',
  },
  'windmill.json': { spritesheet: windmill, url: '/assets/spritesheets/windmill.png' },
  'gentlesplash.json': { spritesheet: gentlesplash,
    url: '/assets/spritesheets/gentlewaterfall32.png',},
};

// Global asset cache to avoid reloading textures
const loadedAssets = new Map<string, any>();

// Preload assets function
export async function preloadMapAssets(map: WorldMap) {
  // Normalize tileset URL to ensure it starts with /assets/
  const normalizedTileSetUrl = map.tileSetUrl.startsWith('/assets/') 
    ? map.tileSetUrl 
    : `/assets/${map.tileSetUrl.replace(/^\/+/, '')}`;
  
  const assetsToLoad = [normalizedTileSetUrl];
  
  // Add all sprite sheet URLs
  for (const sprite of map.animatedSprites) {
    const animation = (animations as any)[sprite.sheet];
    if (animation && !assetsToLoad.includes(animation.url)) {
      assetsToLoad.push(animation.url);
    }
  }
  
  console.log('Preloading assets:', assetsToLoad);
  console.log('Original tileSetUrl:', map.tileSetUrl);
  console.log('Normalized tileSetUrl:', normalizedTileSetUrl);
  
  try {
    // Import PIXI.js Assets dynamically
    const { Assets } = await import('pixi.js');
    
    // Initialize Assets if not already done
    try {
      await Assets.init();
      console.log('Assets initialized successfully');
    } catch (e) {
      console.log('Assets initialization skipped (might already be initialized):', e);
    }
    
    // Reset cache for fresh loading
    loadedAssets.clear();
    
    // Load all assets in parallel
    const results = await Promise.allSettled(assetsToLoad.map(async (url) => {
      console.log('Loading asset:', url);
      const texture = await Assets.load(url);
      console.log('✅ Asset loaded successfully:', url, {
        width: texture.width,
        height: texture.height,
        hasBaseTexture: !!texture.baseTexture
      });
      return { url, texture };
    }));
    
    // Cache successfully loaded assets
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        loadedAssets.set(result.value.url, result.value.texture);
      } else {
        console.error('❌ Failed to load asset:', result.reason);
      }
    });
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Loaded ${successCount}/${assetsToLoad.length} assets successfully`);
    
    return successCount > 0;
  } catch (error) {
    console.error('❌ Critical error in preloadMapAssets:', error);
    return false;
  }
}

export const PixiStaticMap = PixiComponent('StaticMap', {
  create: (props: { map: WorldMap; [k: string]: any }) => {
    const map = props.map;
    
    // Normalize tileset URL to ensure it starts with /assets/
    const normalizedTileSetUrl = map.tileSetUrl.startsWith('/assets/') 
      ? map.tileSetUrl 
      : `/assets/${map.tileSetUrl.replace(/^\/+/, '')}`;
    
    const numxtiles = Math.floor(map.tileSetDimX / map.tileDim);
    const numytiles = Math.floor(map.tileSetDimY / map.tileDim);
    
    // Use preloaded texture or create new one
    let bt: PIXI.BaseTexture;
    if (loadedAssets.has(normalizedTileSetUrl)) {
      console.log('✅ Using preloaded tileset texture:', normalizedTileSetUrl);
      const texture = loadedAssets.get(normalizedTileSetUrl);
      // In PIXI.js v7, Assets.load() returns a Texture, not BaseTexture
      bt = texture.baseTexture || texture;
    } else {
      console.log('⚠️ Loading tileset texture (fallback):', normalizedTileSetUrl);
      // Use Texture.from() instead of BaseTexture.from() for better v7 compatibility
      const texture = PIXI.Texture.from(normalizedTileSetUrl, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
      });
      bt = texture.baseTexture;
    }

    const tiles: PIXI.Texture[] = [];
    for (let x = 0; x < numxtiles; x++) {
      for (let y = 0; y < numytiles; y++) {
        tiles[x + y * numxtiles] = new PIXI.Texture(
          bt,
          new PIXI.Rectangle(x * map.tileDim, y * map.tileDim, map.tileDim, map.tileDim),
        );
      }
    }
    const screenxtiles = map.bgTiles[0].length;
    const screenytiles = map.bgTiles[0][0].length;

    const container = new PIXI.Container();
    const allLayers = [...map.bgTiles, ...map.objectTiles];

    // blit bg & object layers of map onto canvas
    for (let i = 0; i < screenxtiles * screenytiles; i++) {
      const x = i % screenxtiles;
      const y = Math.floor(i / screenxtiles);
      const xPx = x * map.tileDim;
      const yPx = y * map.tileDim;

      // Add all layers of backgrounds.
      for (const layer of allLayers) {
        const tileIndex = layer[x][y];
        // Some layers may not have tiles at this location.
        if (tileIndex === -1) continue;
        const ctile = new PIXI.Sprite(tiles[tileIndex]);
        ctile.x = xPx;
        ctile.y = yPx;
        container.addChild(ctile);
      }
    }

    // TODO: Add layers.
    const spritesBySheet = new Map<string, AnimatedSprite[]>();
    for (const sprite of map.animatedSprites) {
      const sheet = sprite.sheet;
      if (!spritesBySheet.has(sheet)) {
        spritesBySheet.set(sheet, []);
      }
      spritesBySheet.get(sheet)!.push(sprite);
    }
    
    for (const [sheet, sprites] of spritesBySheet.entries()) {
      const animation = (animations as any)[sheet];
      if (!animation) {
        console.error('Could not find animation', sheet);
        continue;
      }
      const { spritesheet, url } = animation;
      
      // Use preloaded texture or create new one
      let texture: PIXI.BaseTexture;
      if (loadedAssets.has(url)) {
        console.log('✅ Using preloaded sprite texture:', url);
        const loadedTexture = loadedAssets.get(url);
        // In PIXI.js v7, handle both Texture and BaseTexture cases
        texture = loadedTexture.baseTexture || loadedTexture;
      } else {
        console.log('⚠️ Loading sprite texture (fallback):', url);
        // Use Texture.from() instead of BaseTexture.from() for better v7 compatibility
        const fallbackTexture = PIXI.Texture.from(url, {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
        });
        texture = fallbackTexture.baseTexture;
      }
      
      const spriteSheet = new PIXI.Spritesheet(texture, spritesheet);
      spriteSheet.parse().then(() => {
        for (const sprite of sprites) {
          const pixiAnimation = spriteSheet.animations[sprite.animation];
          if (!pixiAnimation) {
            console.error('Failed to load animation', sprite);
            continue;
          }
          const pixiSprite = new PIXI.AnimatedSprite(pixiAnimation);
          pixiSprite.animationSpeed = 0.1;
          pixiSprite.autoUpdate = true;
          pixiSprite.x = sprite.x;
          pixiSprite.y = sprite.y;
          pixiSprite.width = sprite.w;
          pixiSprite.height = sprite.h;
          container.addChild(pixiSprite);
          pixiSprite.play();
        }
      }).catch((error) => {
        console.error('Error parsing sprite sheet:', url, error);
      });
    }

    container.x = 0;
    container.y = 0;

    // Set the hit area manually to ensure `pointerdown` events are delivered to this container.
    container.interactive = true;
    container.hitArea = new PIXI.Rectangle(
      0,
      0,
      screenxtiles * map.tileDim,
      screenytiles * map.tileDim,
    );

    return container;
  },

  applyProps: (instance, oldProps, newProps) => {
    applyDefaultProps(instance, oldProps, newProps);
  },
});