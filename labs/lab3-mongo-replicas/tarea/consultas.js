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
// A2  
// ---------------------------------------------------------------------
print("== A2 ==");
// TODO A2
db.eventos.find(
  {
    zonas: {
      $elemMatch: {
        nombre: "VIP",
        precio: { $lt: 48000 }
      }
    }
  },
  {
    _id: 0,
    nombre: 1,
    zonas: {
      $elemMatch: {
        nombre: "VIP",
        precio: { $lt: 48000 }
      }
    }
  }
).forEach(printjson);


// ---------------------------------------------------------------------
// A3 
// ---------------------------------------------------------------------
print("== A3 ==");
db.eventos.find(
  {
    etiquetas: "accesible",
    categoria: {
      $nin: ["teatro", "conferencia"]
    }
  },
  {
    _id: 0,
    nombre: 1
  }
).forEach(printjson);
// ---------------------------------------------------------------------
// A4 
// ---------------------------------------------------------------------
print("== A4 ==");
db.eventos.aggregate([
  {$match: 
    {patrocinador: {$exists: false}}
  },
  {$group: 
    {_id: "$categoria", cantidad: {$sum: 1}}
  },
  {$project: 
    {_id: 0, categoria: "$_id", cantidad: 1}
  },
  {$sort: 
    {categoria: 1}}
]
).forEach(printjson);

// ---------------------------------------------------------------------
// A5  (Giancarlo)  capacidad total por ciudad
// ---------------------------------------------------------------------
print("== A5 ==");

print("");

// ---------------------------------------------------------------------
// Parte B  (Giancarlo)  tamaño de una orden de ejemplo
// ---------------------------------------------------------------------
print("== B bsonsize ==");