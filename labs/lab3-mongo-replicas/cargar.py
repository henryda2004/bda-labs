#!/usr/bin/env python3
"""Paso 5 — Carga de la semilla en el conjunto de réplicas.

Aquí hay DOS ``TODO`` (1 y 2). Cada uno termina en ``raise NotImplementedError``
que usted debe reemplazar. Después de cada TODO el script corre una verificación
automática (``OK:`` o ``VERIFICACIÓN FALLÓ:``). No cambie las firmas de las funciones.

Cada corrida vacía ``eventos`` y ``ordenes`` antes de cargar, así que puede repetirla
mientras depura.

    cargar.py                # carga completa
    cargar.py --lote 100     # lotes más pequeños
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from pymongo import ASCENDING
from pymongo.database import Database

from common import BD, DATA, conectar, fallo, manifest, ok


"Lee los eventos del JSONL, los inserta por lotes y devuelve el total insertado."
def cargar_eventos(db: Database, ruta: Path, lote: int = 500) -> int:
    if lote <= 0:
        raise ValueError("El tamaño del lote debe ser mayor que cero")

    documentos = []
    total = 0

    with ruta.open("r", encoding="utf-8") as archivo:
        for linea in archivo:
            documentos.append(json.loads(linea))

            if len(documentos) == lote:
                resultado = db.eventos.insert_many(documentos, ordered=False)
                total += len(resultado.inserted_ids)
                documentos = []

    if documentos:
        resultado = db.eventos.insert_many(documentos, ordered=False)
        total += len(resultado.inserted_ids)

    return total

"Crea los índices compuestos de eventos, órdenes y devuelve sus nombres."
def crear_indices(db: Database) -> list[str]:
    indice_eventos = db.eventos.create_index(
        [("categoria", ASCENDING), ("fecha", ASCENDING)]
    )

    indice_ordenes = db.ordenes.create_index(
        [("evento_id", ASCENDING), ("estado", ASCENDING)]
    )

    return [indice_eventos, indice_ordenes]

def verificar_carga(db: Database, devueltos: int, m: dict) -> bool:
    bien = True
    if devueltos == m["eventos"]:
        ok(f"cargar_eventos devolvió {devueltos} documentos")
    else:
        fallo(f"cargar_eventos devolvió {devueltos}; el manifiesto dice {m['eventos']}")
        bien = False

    en_bd = db.eventos.count_documents({})
    if en_bd == m["eventos"]:
        ok(f"la colección eventos tiene {en_bd} documentos (mayoría confirmó cada lote)")
    else:
        fallo(f"la colección tiene {en_bd}; el manifiesto dice {m['eventos']}")
        bien = False

    suma = list(
        db.eventos.aggregate(
            [
                {
                    "$group": {
                        "_id": None,
                        "zonas": {"$sum": {"$size": "$zonas"}},
                        "capacidad": {"$sum": {"$sum": "$zonas.capacidad"}},
                    }
                }
            ]
        )
    )
    if suma and suma[0]["zonas"] == m["zonas"] and suma[0]["capacidad"] == m["capacidad_total"]:
        ok(f"zonas ({m['zonas']}) y capacidad total ({m['capacidad_total']}) coinciden")
    else:
        fallo(f"zonas/capacidad en la base: {suma}; esperado {m['zonas']}/{m['capacidad_total']}")
        bien = False
    return bien


def verificar_indices(db: Database) -> bool:
    esperados = {
        "eventos": [("categoria", 1), ("fecha", 1)],
        "ordenes": [("evento_id", 1), ("estado", 1)],
    }
    bien = True
    for coleccion, clave in esperados.items():
        claves = [list(v["key"]) for v in db[coleccion].index_information().values()]
        if clave in claves:
            ok(f"índice {coleccion}{clave} presente")
        else:
            fallo(f"falta el índice compuesto {clave} en {coleccion}; hay: {claves}")
            bien = False
    return bien


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lote", type=int, default=500)
    args = parser.parse_args()

    m = manifest()
    client = conectar()
    db = client[BD]
    print(f"Escritura por defecto de este cliente: {client.write_concern.document}")
    db.eventos.drop()
    db.ordenes.drop()

    inicio = time.perf_counter()
    try:
        devueltos = cargar_eventos(db, DATA / "eventos.jsonl", args.lote)
    except NotImplementedError as exc:
        print(f"PENDIENTE: {exc}")
        return 1
    seg = time.perf_counter() - inicio
    carga_ok = verificar_carga(db, devueltos, m)
    print(f"Carga: {seg:.2f} s ({devueltos / max(seg, 1e-9):.0f} documentos/s)")

    try:
        crear_indices(db)
    except NotImplementedError as exc:
        print(f"PENDIENTE: {exc}")
        return 1
    indices_ok = verificar_indices(db)
    return 0 if carga_ok and indices_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
