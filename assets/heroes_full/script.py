import os
import json
from collections import defaultdict

# --- CONFIGURACIÓN ---

# 1. Ruta a la carpeta que contiene TODAS las imágenes de héroes
#    (Iconos, ilustraciones base, skins, etc.)
images_folder = r"C:\Users\Antikux\Documents\BnS Heroes Assets\hero illust\Texture2D"

# 2. Nombre del archivo JSON que se va a generar con los datos nuevos
output_json_file = "heroes_data_nuevos.json"

# --- LÓGICA DEL SCRIPT (No necesitas modificar nada más abajo) ---

def parse_hero_asset_name(filename):
    """Extrae el nombre base (asset_name) del héroe desde el nombre de un archivo."""
    # Quita la extensión .png y convierte a minúsculas
    base = os.path.splitext(filename)[0].lower()
    parts = base.split('_')

    if base.startswith("full_illust_hero_"):
        # Ejemplo: full_illust_hero_aggyocw_base -> aggyocw
        # Ejemplo: full_illust_hero_bocksle_bm_01 -> bocksle
        if len(parts) > 3:
            asset_name = parts[3]
            # Ignorar archivos dummy o de prueba
            if asset_name not in ["dummy", "template"]:
                return asset_name
    elif len(parts) == 3 and parts[1] == 'a':
        # Ejemplo: aggyocw_a_de -> aggyocw
        asset_name = parts[0]
        if asset_name not in ["dummy", "template"]:
            return asset_name
            
    return None

def get_skin_key(filename, hero_asset_name):
    """Extrae la clave de la skin del nombre del archivo. Ej: 'bm_01'"""
    base = os.path.splitext(filename)[0]
    # Elimina el prefijo y el nombre del héroe
    prefix = f"full_illust_hero_{hero_asset_name}_"
    if base.startswith(prefix):
        return base[len(prefix):]
    return None

print("Iniciando el proceso de generación de datos de héroes...")

# Paso 1: Agrupar todos los archivos por asset_name de héroe
hero_files = defaultdict(list)

if not os.path.isdir(images_folder):
    print(f"¡ERROR! La carpeta de imágenes no existe: {images_folder}")
else:
    print(f"Escaneando carpeta: {images_folder}")
    for filename in os.listdir(images_folder):
        if not filename.lower().endswith('.png'):
            continue # Solo procesar archivos PNG
        
        asset_name = parse_hero_asset_name(filename)
        if asset_name:
            hero_files[asset_name].append(filename)

    print(f"Se encontraron {len(hero_files)} héroes únicos.")

    # Paso 2: Construir la lista de diccionarios para el JSON
    heroes_data = []

    # Procesar héroes en orden alfabético para un resultado consistente
    for hero_asset_name in sorted(hero_files.keys()):
        files = hero_files[hero_asset_name]
        
        hero_entry = {
            "asset_name": hero_asset_name,
            "game_name": "",
            "rarity": 0,
            "available": False, # Por defecto, los nuevos héroes no están disponibles
            "short_image": "",
            "long_image": "",
        }

        skins = {}

        for filename in files:
            filename_lower = filename.lower()
            
            # Clasificar cada archivo
            if f"{hero_asset_name}_a_" in filename_lower:
                hero_entry["short_image"] = filename
            elif f"full_illust_hero_{hero_asset_name}_base" in filename_lower:
                hero_entry["long_image"] = filename
            elif filename_lower.startswith("full_illust_hero_"):
                # Si es una ilustración completa pero no es la base, es una skin
                skin_key = get_skin_key(filename, hero_asset_name)
                if skin_key:
                    skins[skin_key] = filename

        if skins:
            hero_entry["skins"] = skins
        
        heroes_data.append(hero_entry)
        
    # Paso 3: Guardar los datos en el archivo JSON
    try:
        with open(output_json_file, 'w', encoding='utf-8') as f:
            json.dump(heroes_data, f, ensure_ascii=False, indent=4)
        print(f"\n¡Éxito! Se ha creado el archivo '{output_json_file}' con {len(heroes_data)} héroes.")
    except Exception as e:
        print(f"\nError al guardar el archivo JSON: {e}")