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

## Paso 10 - OK (2026-11-02T18:45-06:00)
Comando: sonda_escrituras.py --label Base con w majority y wtimeout 2000 ms, sin falla; luego verificar_rpo.py --csv evidence/rpo-baseline.csv > evidence/rpo-baseline.txt
Resultado: 20 intentos, 20 confirmados, 0 errores; presentes 20; perdidos 0; RPO 0. Sin senal de falla, no se calcula RTO.
Evidencias: rpo-baseline-sonda.txt, rpo-baseline.csv, rpo-baseline.txt.

## Paso 11 - OK (2026-11-02T18:59-06:00)
Falla A, cae un secundario (mongo-2). Senal de falla a las 18:58:00.
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo sh -c "python3 -u labs/lab3-mongo-replicas/sonda_escrituras.py --duration 50 --label FallaA --signal-file evidence/falla-a-stop.epoch --csv evidence/falla-a.csv 2>&1 | tee evidence/falla-a.txt"
Resultado: 100 intentos, 100 confirmados, 0 errores; primera escritura confirmada tras la senal a 97 ms; perdidos 0; RPO 0. Estado durante la falla: mongo-1 PRIMARY, mongo-3 SECONDARY, mongo-2 inalcanzable.
Evidencias: falla-a-before.txt, falla-a-stop.txt, falla-a-stop.epoch, falla-a-status.txt, falla-a.txt, falla-a.csv, falla-a-recovered.txt, falla-a-rpo.txt.

## Paso 12 - OK (2026-11-02T19:08-06:00)
Falla B, cae el primario (mongo-1). Senal de falla a las 19:06:30.
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo sh -c "python3 -u labs/lab3-mongo-replicas/sonda_escrituras.py --duration 70 --label FallaB --signal-file evidence/falla-b-stop.epoch --csv evidence/falla-b.csv 2>&1 | tee evidence/falla-b.txt"
Resultado: 123 intentos, 120 confirmados, 3 ServerSelectionTimeoutError; RTO 10336 ms (primera escritura confirmada tras la senal, tomado del CSV); ventana sin escrituras confirmadas 10779 ms; nuevo primario mongo-3, term 2; perdidos 0; errores que si se escribieron 0; RPO 0.
Evidencias: falla-b-before.txt, falla-b-stop.txt, falla-b-stop.epoch, falla-b-status.txt, falla-b.txt, falla-b.csv, falla-b-recovered.txt, falla-b-rpo.txt.

## Paso 13 - OK (2026-11-02T19:12-06:00)
Falla C, caen mongo-1 y mongo-2 y queda solo mongo-3, sin mayoria. Senal de falla a las 19:10:08.
Comando: docker compose --profile lab3 run --rm --no-deps app-mongo sh -c "python3 -u labs/lab3-mongo-replicas/sonda_escrituras.py --duration 90 --label FallaC --w majority --wtimeout-ms 2000 --signal-file evidence/falla-c-stop.epoch --csv evidence/falla-c.csv 2>&1 | tee evidence/falla-c.txt"
Resultado: 111 intentos, 97 confirmados, 14 con error (9 ServerSelectionTimeoutError, 4 WTimeoutError, 1 WriteConcernError). mongo-3 quedo SECONDARY. Primera escritura confirmada a 41451 ms de la senal; ventana sin escrituras confirmadas 42069 ms. Presentes 102; perdidos 0; errores que si se escribieron 5 (seq 15 a 19); errores que no se escribieron 9; RPO 0 sobre confirmadas.
Recuperacion: los tres nodos healthy, mongo-1 PRIMARY, term 3, un primario y dos secundarios.
Evidencias: falla-c-before.txt, falla-c-stop.txt, falla-c-stop.epoch, falla-c-status.txt, falla-c.txt, falla-c.csv, falla-c-recovered.txt, falla-c-rpo.txt.