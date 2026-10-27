db.eventos.dropIndexes();
print("documentos en la colección : " + db.eventos.countDocuments());
print("índices al inicio          : " + db.eventos.getIndexes().length + " (solo _id)");
print("");

// ---------------------------------------------------------------------
// A1  (Henry)  conciertos de Heredia entre 2026-12-01 y 2027-02-28
// ---------------------------------------------------------------------
print("== A1 ==");

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