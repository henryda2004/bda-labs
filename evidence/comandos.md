# Registro de comandos — Laboratorio 3


## Paso 1 — OK (2026-11-02T11:49:41-06:00)
Comandos: make lab3-up; make lab3-status.
Resultado: tres nodos healthy; NotYetInitialized. Evidencia: cluster-start.txt.

## Pasos 2 y 3 — OK (2026-11-02T11:55:58-06:00)
Configuracion ejecutada en mongosh: rs.initiate({_id:"rs-lab3",members:[{_id:0,host:"mongo-1:27017"},{_id:1,host:"mongo-2:27017"},{_id:2,host:"mongo-3:27017"}]}).
Inspeccion: rs.status(), rs.conf() y db.hello().
Resultado: mongo-1 PRIMARY; mongo-2 y mongo-3 SECONDARY; term 1. Evidencia: rs-inspect.txt.

## Paso 4 — OK (2026-11-02T11:57:40-06:00)
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo python3 labs/lab3-mongo-replicas/generar_datos.py
Resultado: 400 eventos, 1189 zonas, capacidad total 162810. Evidencia: datos-manifest.txt.

## Paso 5 — OK (2026-11-02T12:16:53-06:00)
Carga: cargar.py --lote 100; cinco verificaciones OK.
Verificacion: make lab3-check; resultado 6/6.
Explain: indice IXSCAN, 67 documentos y 67 claves; recorrido COLLSCAN, 400 documentos y 0 claves. Ambos devuelven 67 resultados.
Evidencias: carga.txt, config-check.txt, explain-indices.txt.

## Paso 6 — OK (2026-11-02T12:36:41-06:00)
Comandos: insertOne en el primario; consulta de local.oplog.rs; rs.printSecondaryReplicationInfo(); db.getReplicationInfo(); lectura e intento de escritura en mongo-2.
Resultado: ORD-MANUAL-1 replicada; secundarios con retraso 0 s; escritura rechazada con NotWritablePrimary (10107); ventana observada del oplog de 2629 s.
Evidencia: oplog.txt.
