# Evidencia Lab 3: réplicas en MongoDB

## Entorno de las mediciones (pasos 7 a 13)

| Elemento | Valor |
|---|---|
| Equipo | ASUS ROG Strix G513QY |
| CPU | AMD Ryzen 9 5980HX |
| RAM | 63.4 GB |
| SO | Windows 11 Home 10.0.26200 |
| Contenedores | Docker Desktop, Docker Compose (proyecto `ti4601`, perfil `lab3`) |
| Motor | MongoDB 8.0, replica set `rs-lab3` (mongo-1, mongo-2, mongo-3) |

Los tres nodos corren en la misma máquina. Las latencias reflejan red local de Docker, no una red real entre sitios, así que solo se comparan entre sí.

Los pasos 0 a 6 (levantar el clúster, `rs.initiate`, carga de datos, índices, oplog) se ejecutaron en el equipo de Nicol Otárola. Los pasos 7 a 13 se ejecutaron en el equipo descrito arriba. Dependen de la máquina únicamente el tiempo de carga, `executionTimeMillis` y el tamaño de la ventana del oplog.

## Parámetros

- Benchmark de write concern: n = 300 escrituras por configuración, 30 de calentamiento descartadas.
- Sonda de escrituras: `w: majority`, `wtimeout` 2000 ms, `retryWrites` activo.
- Lecturas de verificación de RPO con `readConcern: majority`.
- `electionTimeoutMillis` 10000, `heartbeatIntervalMillis` 2000.

## Índice de archivos

| Archivo | Paso |
|---|---|
| `lectura-secundario.txt`, `.csv` | 7, lecturas en secundario y datos obsoletos |
| `comprar.txt`, `comprar-roto.txt` | 8, compra atómica y versión rota |
| `write-concern.txt`, `.csv` | 9, latencia por write concern |
| `rpo-baseline.csv`, `.txt`, `rpo-baseline-sonda.txt` | 10, RPO sin falla |
| `falla-a*.txt`, `falla-a.csv` | 11, cae un secundario |
| `falla-b*.txt`, `falla-b.csv` | 12, cae el primario |
| `falla-c*.txt`, `falla-c.csv` | 13, quedan menos de la mayoría |
| `resumen-fallas.md` | Resumen comparado de las tres fallas |

Cada falla tiene archivos `-before`, `-stop`, `-status`, `-recovered` y `-rpo` con el estado del clúster en cada momento.

## Reproducir

Desde la raíz del repositorio:

```
docker compose --profile lab3 up -d
docker compose --profile lab3 run --rm --no-deps app-mongo python3 labs/lab3-mongo-replicas/verificar_rpo.py --csv evidence/falla-c.csv
```
