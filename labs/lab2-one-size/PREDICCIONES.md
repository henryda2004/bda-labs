# Predicciones previas, Laboratorio 2

Las siguientes predicciones se redactaron el 17 de octubre de 2026, antes de ejecutar cualquier medición.

## Paso 1, espacio

Se espera que Postgres ocupe menos espacio por viaje, cerca de 180 B por fila, debido a que almacena columnas tipadas de ancho fijo y no repite los nombres de columna. En Valkey se espera un uso cercano a 500 B por fila, entre 2,5 y 3 veces mayor, porque cada hash guarda los 19 nombres de campo y todos los valores como texto.

Para el mes completo se estiman unos 2 GB en disco para Postgres y entre 5 y 6 GB en RAM para Valkey. Por esta razón, solo Postgres podría guardar un año entero en una laptop.

## Paso 2, GROUP BY

Se espera que Postgres sea cerca de 50 veces más rápido sobre el mismo millón de filas. Esto se debe a que Postgres agrega dentro del motor, en paralelo y junto a los datos, mientras que Valkey no tiene la primitiva de agregación. En consecuencia, el cliente debe traer los campos de cada llave por la red y sumar por su cuenta.

Se espera además que el nodo más costoso del plan de Postgres sea el Parallel Seq Scan.

## Paso 3a, operación por llave

Se espera que la lectura por llave quede casi empatada, dentro de un factor de 2, porque en ambos motores domina el viaje de red. En el update se espera que Valkey gane por 5 a 10 veces o más, ya que Postgres con autocommit espera el fsync del WAL en cada UPDATE, y Valkey, tal como está configurado, no escribe a disco.

## Paso 3b, feed

Se espera el siguiente orden, de la variante más lenta a la más rápida.

1. postgres_commit_por_mensaje
2. valkey_aof_always
3. postgres_commit_asincrono
4. valkey_por_mensaje
5. postgres_lote
6. valkey_pipeline

Las dos primeras esperan al disco en cada mensaje. Las dos siguientes no esperan al disco, pero pagan un viaje de red por mensaje. Las dos últimas amortizan la red y el commit por lote. Debe señalarse que la confianza es baja en el orden entre las posiciones 5 y 6.

## Durabilidad frente a modelo

Se espera que pasar de postgres_commit_por_mensaje a postgres_commit_asincrono mejore el rendimiento entre 3 y 4 veces, y esa sería la parte atribuible a la durabilidad. Entre los pares comparables, la diferencia restante debería ser pequeña, de 1,2 a 1,5 veces, y correspondería al modelo.

Por lo tanto, no se espera que la brecha de 160 000 contra 900 mensajes por segundo del paper se reproduzca por completo en este laboratorio.