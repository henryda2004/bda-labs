# Predicciones previas, Laboratorio 3

Las predicciones de los pasos 4 y 5 ya quedaron redactadas en el informe. Este
archivo registra las de los pasos 7, 9, 11, 12 y 13, y se le hace commit
**antes** de ejecutar cada uno de esos pasos, para que la marca de tiempo
demuestre que la predicción fue anterior a la medición.

**Integrantes:** Henry Núñez Pérez, Nicol Otárola Porras, Giancarlo Vega Marín
**Máquina de las mediciones:** la del paso 7 en adelante corre en un solo equipo.

---

## Paso 7, lecturas obsoletas en un secundario

Se espera este orden, de más lecturas obsoletas a menos.

1. `w1_secundario`, el más alto. La escritura se confirma apenas la aplica el
   primario, así que la lectura inmediata en un secundario llega antes de que
   la replicación lo alcance.
2. `majority_secundario`, bastante más bajo pero **distinto de cero**. Con
   `w:"majority"` en tres nodos la mayoría son dos, o sea el primario y un
   secundario. Si la lectura cae en el otro secundario, el que todavía no tiene
   el dato, la lectura sale obsoleta.
3. `causal_majority`, exactamente 0 %. La sesión causalmente consistente lleva
   el tiempo de operación de la escritura y obliga al secundario a esperar a
   haberlo aplicado antes de responder.

Como los tres nodos están en la misma máquina, la replicación es de
milisegundos y los porcentajes de los dos primeros modos deberían ser más bajos
que en un despliegue con red real.

En términos de CAP, los dos primeros modos sacrifican consistencia para ganar
disponibilidad y latencia de lectura, mientras que el tercero prioriza
consistencia y paga la espera.

## Paso 9, costo de las garantías de escritura

Orden esperado, de más rápida a más lenta.

1. `w1`
2. `w1 + j:true`
3. `majority`
4. `w3`

`w1` solo espera a que el primario aplique la operación en memoria. Agregar
`j:true` obliga a un `fsync` del journal, que es el primer costo de disco real.
`majority` además espera la confirmación de un segundo nodo, y en MongoDB el
valor por defecto de `writeConcernMajorityJournalDefault` hace que esa mayoría
también escriba su journal, así que acumula los dos costos.

Se estima que `majority` resulte entre 2 y 5 veces más lenta que `w1`.

Se espera que `w3` y `majority` queden cerca, porque en un conjunto de tres
nodos la mayoría ya son dos, y el tercer nodo, al estar en la misma máquina,
confirma casi al mismo tiempo que el segundo. La diferencia sería mayor si un
nodo estuviera en otra región.

## Paso 11, Falla A, cae un secundario

No se esperan errores. Al caer un secundario quedan dos nodos vivos, el
primario y el otro secundario, y dos de tres es exactamente la mayoría, así que
el conjunto conserva primario y sigue confirmando escrituras con
`w:"majority"`. La continuidad se explica por esa mayoría y no por otro
mecanismo.

Se espera un pico aislado de latencia alrededor de la falla, mientras el
primario deja de recibir latidos del nodo detenido y lo marca como caído. El
RPO debería ser 0.

Al volver, el nodo reanuda desde el oplog del primario, y como el corte es de
pocos segundos su atraso cabe de sobra en la ventana del oplog, así que no
necesita sincronización inicial.

## Paso 12, Falla B, cae el primario

Se espera una ventana sin primario y, por lo tanto, una racha de errores en la
sonda, del tipo `ServerSelectionTimeoutError`, porque el cliente no encuentra a
quién escribir.

La duración depende de `electionTimeoutMillis`, que está en 10 000 ms. Ese es
el tiempo que un secundario espera sin oír al primario antes de pedir votos, así
que el RTO observado tiene que ser **mayor** que 10 segundos, porque además hay
que sumar la elección en sí, el descubrimiento del nuevo primario por parte del
driver y el reintento de la sonda. Se estima un RTO de entre 12 y 20 segundos.

El `term` debe subir respecto al valor 1 que se observó en el paso 3, porque
cada elección abre una época nueva. El nodo que se detuvo regresa como
secundario y no recupera el rol, ya que no existe apropiación automática cuando
todas las prioridades son iguales.

El RPO se espera en 0 sobre las operaciones **confirmadas**. Los intentos que
terminaron en error tienen resultado desconocido y no cuentan como confirmados
perdidos.

## Paso 13, Falla C, caen los dos secundarios

Con un solo nodo vivo no hay mayoría, así que el sobreviviente **deja de ser
primario** y pasa a secundario. No lo hace de inmediato, tarda alrededor de
`electionTimeoutMillis`, unos 10 segundos, que es lo que aguanta creyéndose
primario sin confirmar que todavía manda.

Durante esa ventana ninguna escritura con `w:"majority"` se confirma, porque la
garantía es imposible de cumplir sin un segundo nodo. Se espera ver
`WTimeoutError`, que significa que el primario sí aplicó la escritura
localmente pero no logró la mayoría dentro del plazo, y después
`ServerSelectionTimeoutError`, cuando ya no hay primario al que escribir.

Lo importante es que varias de esas escrituras con error **sí quedaron
escritas** en el nodo vivo, y se replican cuando los otros vuelven. Por eso un
error no equivale a un dato no escrito, y por eso las operaciones del Proyecto 2
tienen que ser idempotentes, ya que un cliente que reintente tras un error puede
estar repitiendo algo que ya se aplicó.

Comparado con la falla B del Laboratorio 1, la mayoría es la misma, dos de tres,
y el resultado también, sin mayoría no hay progreso. Lo que cambia es el
protocolo y la forma de reportarlo al cliente.
