import json

# Load the Minecraft blocks
with open('minecraft-data-1.21/blocks.json', 'r') as f:
    minecraft_blocks = json.load(f)

# Create initial mappings dictionary
mappings = {}

# Process each block
for block in minecraft_blocks:
    name = block.get('name')
    if not name:
        continue
        
    # Skip blocks that aren't full blocks or are technical blocks
    if block.get('boundingBox') != 'block' or 'hard_' in name or 'technical' in name:
        mappings[name] = None
        continue

    # Default mapping is null
    mappings[name] = None

    # Basic material mappings
    if any(x in name for x in ['stone', 'granite', 'diorite', 'andesite', 'deepslate', 'tuff', 'calcite']):
        mappings[name] = 'stone'
    elif any(x in name for x in ['dirt', 'podzol', 'mud']):
        mappings[name] = 'dirt'
    elif '_planks' in name:
        mappings[name] = 'oak-planks'
    elif '_log' in name:
        mappings[name] = 'log'
    elif '_leaves' in name:
        mappings[name] = 'oak-leaves'
    elif 'glass' in name:
        mappings[name] = 'glass'
    elif 'sand' in name and 'red' in name:
        mappings[name] = 'sand-light'
    elif 'sand' in name:
        mappings[name] = 'sand'
    elif name in ['netherrack', 'basalt', 'polished_basalt']:
        mappings[name] = 'shadowrock'
    elif name in ['soul_sand', 'soul_soil']:
        mappings[name] = 'ghost-dirt'
    elif name in ['end_stone', 'end_stone_bricks']:
        mappings[name] = 'void-sand'
    elif 'sculk' in name or 'moss_block' in name:
        mappings[name] = 'creep'
    elif 'ice' in name:
        mappings[name] = 'ice'
    elif name == 'snow_block':
        mappings[name] = 'snow'
    elif 'amethyst' in name:
        mappings[name] = 'nuit'

# Write the mappings to a file
with open('minecraft-to-hytopia-mappings.json', 'w') as f:
    json.dump(mappings, f, indent=2)

print(f"Generated mappings for {len(mappings)} blocks") 