db.eventos.dropIndexes();
print("documentos en la colección : " + db.eventos.countDocuments());
print("índices al inicio          : " + db.eventos.getIndexes().length + " (solo _id)");
print("");

// ---------------------------------------------------------------------
// A1
// ---------------------------------------------------------------------
function cadenaEtapas(etapa) {
  var nombres = [];
  while (etapa) { nombres.push(etapa.stage); etapa = etapa.inputStage; }
  return nombres.join(" <- ");
}

function resumenExplain(caso, stats) {
  printjson({
    caso: caso,
    etapas: cadenaEtapas(stats.executionStages),
    nReturned: stats.nReturned,
    totalKeysExamined: stats.totalKeysExamined,
    totalDocsExamined: stats.totalDocsExamined,
    executionTimeMillis: stats.executionTimeMillis
  });
}

var filtroA1 = {
  categoria: "concierto",
  ciudad: "Heredia",
  fecha: { $gte: "2026-12-01", $lte: "2027-02-28" }
};
var proyA1 = { _id: 0, nombre: 1, recinto: 1, fecha: 1 };

print("== A1 ==");
db.eventos.find(filtroA1, proyA1).sort({ fecha: 1 }).forEach(printjson);
print("");

print("== A1 explain SIN índice ==");
resumenExplain("sin índice",
  db.eventos.find(filtroA1, proyA1).sort({ fecha: 1 })
            .explain("executionStats").executionStats);
print("");

print("== A1 índice ==");
printjson(db.eventos.createIndex({ categoria: 1, ciudad: 1, fecha: 1 },
                                 { name: "a1_categoria_ciudad_fecha" }));
print("");

print("== A1 explain CON índice ==");
resumenExplain("con índice",
  db.eventos.find(filtroA1, proyA1).sort({ fecha: 1 })
            .explain("executionStats").executionStats);
print("");

// ---------------------------------------------------------------------
// A2  (Nicol)  eventos con zona VIP de precio menor a 48000
// ---------------------------------------------------------------------
print("== A2 ==");

print("");

print("== A2b sin $elemMatch ==");

print("");

// ---------------------------------------------------------------------
// A3  (Nicol)  etiqueta accesible, categoría distinta de teatro y conferencia
// ---------------------------------------------------------------------
print("== A3 ==");

print("");

// ---------------------------------------------------------------------
// A4  (Giancarlo)  eventos sin patrocinador, por categoría
// ---------------------------------------------------------------------
print("== A4 ==");

print("");

// ---------------------------------------------------------------------
// A5  (Giancarlo)  capacidad total por ciudad
// ---------------------------------------------------------------------
print("== A5 ==");

print("");

// ---------------------------------------------------------------------
// Parte B  (Giancarlo)  tamaño de una orden de ejemplo
// ---------------------------------------------------------------------
print("== B bsonsize ==");