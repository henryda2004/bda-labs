# Resumen de fallas (pasos 11 a 13)

Todas las corridas usan `w: majority`, `wtimeout` 2000 ms. RTO medido como tiempo hasta la primera escritura confirmada tras la señal de falla, tomado del CSV. RPO calculado solo sobre operaciones confirmadas.

| | Falla A: cae un secundario | Falla B: cae el primario | Falla C: quedan menos de la mayoría |
|---|---|---|---|
| Corrida | r84ab8622 | r06553726 | rb7db03e5 |
| Intentos | 100 | 123 | 111 |
| Confirmados | 100 | 120 | 97 |
| Con error | 0 | 3 | 14 |
| Tipos de error | ninguno | 3 ServerSelectionTimeoutError | 9 ServerSelectionTimeoutError, 4 WTimeoutError, 1 WriteConcernError |
| Primera escritura confirmada tras la señal | 97 ms | 10336 ms | 41451 ms |
| Ventana sin escrituras confirmadas | ninguna | 10779 ms | 42069 ms |
| Perdidos (confirmados ausentes) | 0 | 0 | 0 |
| Errores que sí se escribieron | 0 | 0 | 5 (seq 15 a 19) |
| Errores que no se escribieron | 0 | 3 | 9 |
| RPO sobre confirmados | 0 | 0 | 0 |

## Lectura

- **A.** Con dos de tres nodos vivos sigue habiendo mayoría y el primario no cambia. La sonda no ve la falla.
- **B.** Cae el primario. Los dos secundarios restantes forman mayoría, pero esperan `electionTimeoutMillis` (10 s) antes de elegir. El RTO de 10.3 s corresponde a ese tiempo más la elección.
- **C.** Cae mayoría. El nodo restante se degrada a secundario y no puede aceptar escrituras. Las escrituras sin primario fallan con `ServerSelectionTimeoutError`. Al volver los otros nodos hubo nueva elección (term 3) y se retomaron las escrituras.
- Un error no implica que no se escribiera. En C, los 4 `WTimeoutError` y el `WriteConcernError` se aplicaron en el nodo y quedaron en la base tras la recuperación: hay 102 documentos presentes y solo 97 confirmados. Los 9 `ServerSelectionTimeoutError` no se escribieron porque no había primario.
- Consecuencia de diseño: ante un error el cliente no sabe si la operación se aplicó. Las operaciones deben ser idempotentes, como la compra con `orden_id` como `_id`.
- En ninguna falla se perdió una escritura confirmada con `w: majority`.
