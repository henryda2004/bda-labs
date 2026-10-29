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
// A5 
// ---------------------------------------------------------------------
print("== A5 ==");
db.eventos.aggregate([
  {$unwind: "$zonas"},
  {$group: {_id: "$ciudad", capacidad_total: {$sum: "$zonas.capacidad"}}},
  {$project: {_id: 0, ciudad: "$_id", capacidad_total: 1}},
  {$sort: {capacidad_total: -1, ciudad: 1}}
]
).forEach(printjson);

// ---------------------------------------------------------------------
// Parte B  
// ---------------------------------------------------------------------
print("== A2b sin $elemMatch ==");
printjson({
  con_elemMatch: db.eventos.countDocuments(
    { zonas: { $elemMatch: { nombre: "VIP", precio: { $lt: 48000 } } } }),
  sin_elemMatch: db.eventos.countDocuments(
    { "zonas.nombre": "VIP", "zonas.precio": { $lt: 48000 } })
});
print("");

print("== B bsonsize ==");
var ordenEjemplo = {
  _id: "ORD-000001", evento_id: "EV-0001", zona: "VIP",
  cantidad: 2, estado: "pendiente",
  creada_en: ISODate("2026-10-26T18:00:00Z")
};
var ev = db.eventos.findOne({ _id: "EV-0001" });
ev.ordenes = [];
var bytesOrden = Object.bsonsize(ordenEjemplo);
var total = Object.bsonsize(ev);
var limite = 16 * 1024 * 1024;
var n = 0;
while (total + bytesOrden + 2 + String(n).length <= limite) {
  total = total + bytesOrden + 2 + String(n).length;
  n++;
}
printjson({
  bytes_orden: bytesOrden,
  bytes_evento_con_ordenes_vacio: Object.bsonsize(ev),
  limite_bytes: limite, ordenes_que_caben: n, bytes_finales: total
});