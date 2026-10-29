"""Generate simplified tourism-region outlines from IBGE's 2024 municipal mesh.

Requires pyshp and shapely. The municipality groups follow the Ministry of
Tourism's Mapa do Turismo Brasileiro, snapshot of 31 December 2025.
"""

import io
import json
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import mapping, shape
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
IBGE_URL = "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2024/UFs/MS/MS_Municipios_2024.zip"
TOURISM_URL = "https://www.gov.br/turismo/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/programa-de-regionalizacao-do-turismo-2/mapa-do-turismo-brasileiro/versoes-anteriores/31122025.pdf"
REGIONS = {
    "pantanal": ["Aquidauana", "Corumbá", "Ladário", "Miranda"],
    "bodoquena": ["Bodoquena", "Bonito", "Jardim", "Nioaque", "Porto Murtinho"],
}


def main():
    archive_path = Path(tempfile.gettempdir()) / "MS_Municipios_2024.zip"
    if not archive_path.exists():
        urllib.request.urlretrieve(IBGE_URL, archive_path)
    with zipfile.ZipFile(archive_path) as archive:
        base = "MS_Municipios_2024"
        reader = shapefile.Reader(
            shp=io.BytesIO(archive.read(f"{base}.shp")),
            shx=io.BytesIO(archive.read(f"{base}.shx")),
            dbf=io.BytesIO(archive.read(f"{base}.dbf")),
            encoding="cp1252",
        )
        municipalities = {
            record.record["NM_MUN"]: shape(record.shape.__geo_interface__)
            for record in reader.shapeRecords()
        }

    output = ROOT / "public/geo"
    output.mkdir(exist_ok=True)
    for region, names in REGIONS.items():
        missing = set(names) - municipalities.keys()
        if missing:
            raise ValueError(f"Missing municipalities: {missing}")
        geometry = unary_union([municipalities[name] for name in names]).simplify(0.012, preserve_topology=True)
        if not geometry.is_valid:
            raise ValueError(f"Invalid geometry for {region}")
        feature = {
            "type": "Feature",
            "properties": {
                "region": region,
                "municipalities": names,
                "mesh": IBGE_URL,
                "tourismRegion": TOURISM_URL,
            },
            "geometry": mapping(geometry),
        }
        path = output / f"{region}.geojson"
        path.write_text(json.dumps(feature, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(region, geometry.bounds, path.stat().st_size)


if __name__ == "__main__":
    main()
