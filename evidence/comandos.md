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

## Paso 7 — OK (2026-11-02T18:26-06:00)
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo sh -c "python3 labs/lab3-mongo-replicas/lectura_secundario.py --n 500 --csv evidence/lectura-secundario.csv > evidence/lectura-secundario.txt 2>&1"
Resultado: w1_secundario 497/500 obsoletas (99.4%); majority_secundario 0/500 (0.0%); causal_majority 0/500 (0.0%).
Evidencias: lectura-secundario.txt, lectura-secundario.csv.

## Paso 8 — OK (2026-11-02T18:40-06:00)
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo sh -c "python3 labs/lab3-mongo-replicas/comprar.py > evidence/comprar.txt 2>&1"
Resultado: seis verificaciones OK; 120 confirmadas y 80 agotadas sobre 200 compradores; quedan 0 entradas.
Version rota a proposito (leer, decidir en Python, escribir): 151 confirmadas, quedan -31; VIP 3 confirmadas, quedan -2. Las verificaciones secuenciales (idempotencia y zona inexistente) siguieron pasando.
Evidencias: comprar.txt, comprar-roto.txt.

## Paso 9 — OK (2026-11-02T18:43-06:00)
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo sh -c "python3 labs/lab3-mongo-replicas/bench_write_concern.py --n 300 --csv evidence/write-concern.csv > evidence/write-concern.txt 2>&1"
Resultado (p50 ms): w1 0.78; w1_journal 1.79; majority 2.53; w3 1.63. n=300 por variante, calentamiento 30.
Observacion: w3 resulto mas rapida que majority porque majority activa el journal por defecto (writeConcernMajorityJournalDefault).
Evidencias: write-concern.txt, write-concern.csv.