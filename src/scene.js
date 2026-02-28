/**
 * CafeScene — Loads Tiled JSON tilemap + furniture sprites.
 */
export class CafeScene extends Phaser.Scene {
  constructor() { super({ key: 'CafeScene' }); }

  preload() {
    // Tilemap
    this.load.tilemapTiledJSON('map', 'assets/maps/cafe.json');
    
    // Tilesets (must match names in the JSON)
    this.load.image('floors', 'assets/tilesets/Room_Builder_Floors_48x48.png');
    this.load.image('walls', 'assets/tilesets/Room_Builder_Walls_48x48.png');
    
    // Furniture sprites — load all from assets/sprites/
    const sprites = [
      'easel_painting', 'easel_blank', 'paint_supplies',
      'bookshelf', 'sofa', 'coffee_table', 'lamp_floor',
      'bed', 'nightstand', 'lamp_table',
      'plant_tall', 'plant_small',
      'wall_art_1', 'wall_art_2', 'wall_art_3',
      'counter_left', 'counter', 'counter_right',
      'espresso_machine', 'coffee_maker', 'cash_register',
      'display_case_stocked', 'stool',
      'chair_back', 'chair_front', 'chair_front_b',
      'chair_left', 'chair_right',
      'table_small', 'table_large'
    ];
    sprites.forEach(s => this.load.image(s, `assets/sprites/${s}.png`));
    
    // Café-specific wall art
    this.load.image('wall_art_cafe_1', 'assets/sprites/cafe/wall_art_cafe_1.png');
    this.load.image('wall_art_cafe_2', 'assets/sprites/cafe/wall_art_cafe_2.png');
    this.load.image('wall_shelf', 'assets/sprites/cafe/wall_shelf.png');
  }

  create() {
    // Create tilemap
    const map = this.make.tilemap({ key: 'map' });
    
    // Add tilesets
    const floorTileset = map.addTilesetImage('floors', 'floors');
    const wallTileset = map.addTilesetImage('walls', 'walls');
    
    // Create tile layers
    const floorLayer = map.createLayer('floor', [floorTileset, wallTileset]);
    const wallLayer = map.createLayer('walls', [floorTileset, wallTileset]);
    
    if (floorLayer) floorLayer.setDepth(0);
    if (wallLayer) wallLayer.setDepth(1);
    
    // Place furniture from the object layer
    const furnitureLayer = map.getObjectLayer('furniture');
    if (furnitureLayer) {
      furnitureLayer.objects.forEach(obj => {
        const spriteProp = obj.properties?.find(p => p.name === 'sprite');
        if (!spriteProp) return;
        
        // Derive texture key from sprite filename
        let key = spriteProp.value
          .replace('.png', '')
          .replace('cafe/', 'wall_art_cafe_')
          .replace('/', '_');
        
        // Handle café subdir sprites
        if (spriteProp.value.startsWith('cafe/wall_art_cafe_1')) key = 'wall_art_cafe_1';
        if (spriteProp.value.startsWith('cafe/wall_art_cafe_2')) key = 'wall_art_cafe_2';
        if (spriteProp.value.startsWith('cafe/wall_shelf')) key = 'wall_shelf';
        
        if (this.textures.exists(key)) {
          this.add.image(obj.x, obj.y, key).setOrigin(0, 0).setDepth(2);
        }
      });
    }
    
    // Camera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
  }
}
