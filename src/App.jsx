import React, { useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

const opciones = [
  "Nada probable",
  "Poco probable",
  "Probable",
  "Muy probable",
];

const preguntas = [
  {
    texto: "¿Con qué probabilidad crees que tiene síntomas de depresión?",
    trastorno: "Depresión mayor",
  },
  {
    texto: "¿Con qué probabilidad crees que tiene síntomas de ansiedad?",
    trastorno: "Trastorno de ansiedad generalizada",
  },
];

function SortableUser(props) {
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({
    id: props.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "4px 8px",
    margin: "2px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fafafa",
    cursor: "grab",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.id}
    </div>
  );
}

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [fase, setFase] = useState("registro");

  // Para cada usuario, guardamos para cada pregunta:
  // respuesta propia: índice 0-3
  // respuestas de otros usuarios: mapa usuario -> índice 0-3
  const [respuestas, setRespuestas] = useState({});

  // Drag & drop state
  const [activeId, setActiveId] = useState(null);

  // Para registrar usuario
  const agregarUsuario = () => {
    const nombre = nuevoUsuario.trim();
    if (nombre && !usuarios.includes(nombre)) {
      setUsuarios([...usuarios, nombre]);
      setNuevoUsuario("");
    }
  };

  // Iniciar test: estructura de respuestas
  const iniciarTest = () => {
    const init = {};
    usuarios.forEach((u) => {
      init[u] = preguntas.map(() => ({
        self: null,
        otros: {
          // opción => lista de usuarios arrastrados a esa opción
          0: [],
          1: [],
          2: [],
          3: [],
        },
      }));
    });
    setRespuestas(init);
    setFase("test");
  };

  // Cambiar respuesta propia (select)
  const cambiarRespuestaPropia = (usuario, idxPregunta, valor) => {
    setRespuestas((prev) => {
      const copia = {...prev};
      copia[usuario][idxPregunta].self = valor;
      return copia;
    });
  };

  // Drag & Drop handlers
  const sensores = useSensors(useSensor(PointerSensor));

  // Aquí el estado temporal para saber qué usuario se arrastra y dónde se suelta
  // Necesitamos saber a qué pregunta, usuario y opción pertenece la zona de drop

  // Para simplificar, vamos a permitir arrastrar usuarios solo dentro de las opciones de cada pregunta para cada usuario objetivo

  // Al iniciar drag:
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Al terminar drag:
  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      // over.id tiene formato: `${usuario}-${idxPregunta}-${opcion}`
      const [usuarioObj, idxPreguntaStr, opcionStr] = over.id.split("-");
      const idxPregunta = Number(idxPreguntaStr);
      const opcion = Number(opcionStr);

      setRespuestas((prev) => {
        const copia = {...prev};
        // Buscar dónde estaba el usuario activo antes
        for (let i = 0; i < preguntas.length; i++) {
          for (let op = 0; op < 4; op++) {
            const lista = copia[usuarioObj][i].otros[op];
            const pos = lista.indexOf(active.id);
            if (pos !== -1) {
              lista.splice(pos, 1);
            }
          }
        }
        // Añadir usuario al nuevo slot
        copia[usuarioObj][idxPregunta].otros[opcion].push(active.id);
        return copia;
      });
    }
    setActiveId(null);
  };

  // Mostrar resultados (promedio simple entre self y valorados por otros)
  const calcularResultados = (usuario) => {
    const cuenta = {};
    preguntas.forEach((p) => (cuenta[p.trastorno] = 0));
    const total = preguntas.length * 4; // sumamos escala 0..3 para cada pregunta

    respuestas[usuario]?.forEach((r, idx) => {
      // Suma respuesta propia (asumimos valores numéricos)
      cuenta[preguntas[idx].trastorno] += r.self !== null ? Number(r.self) : 0;

      // Suma valoraciones de otros: promedio del índice ponderado
      const otros = r.otros;
      let sumaOtros = 0;
      let n = 0;
      for (let op = 0; op < 4; op++) {
        const cuantos = otros[op].length;
        sumaOtros += cuantos * op;
        n += cuantos;
      }
      if (n > 0) {
        cuenta[preguntas[idx].trastorno] += sumaOtros / n;
      }
    });

    // Convertir a porcentaje simplificado
    const porcentajes = Object.entries(cuenta).map(([t, val]) => ({
      trastorno: t,
      porcentaje: Math.round((val / total) * 100),
    }));

    return porcentajes.sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 3);
  };

  return (
    <div style={{padding: 20, maxWidth: 900, margin: "auto"}}>
      <h1>Test Salud Mental (4 opciones y drag & drop)</h1>

      {fase === "registro" && (
        <>
          <input
            type="text"
            placeholder="Nombre usuario"
            value={nuevoUsuario}
            onChange={(e) => setNuevoUsuario(e.target.value)}
          />
          <button onClick={agregarUsuario} disabled={!nuevoUsuario.trim()}>
            Agregar usuario
          </button>
          <ul>
            {usuarios.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
          {usuarios.length >= 2 && (
            <button onClick={iniciarTest}>Iniciar Test</button>
          )}
        </>
      )}

      {fase === "test" && (
        <DndContext
          sensors={sensores}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {usuarios.map((usuario) => (
            <div
              key={usuario}
              style={{
                border: "1px solid #ccc",
                borderRadius: 6,
                marginBottom: 20,
                padding: 15,
              }}
            >
              <h2>Evaluando a: {usuario}</h2>

              {preguntas.map((pregunta, idx) => (
                <div key={idx} style={{marginBottom: 20}}>
                  <p>{pregunta.texto}</p>
                  <label>
                    Mi respuesta (para {usuario}):
                    <select
                      value={
                        respuestas[usuario]?.[idx]?.self !== null
                          ? respuestas[usuario][idx].self
                          : ""
                      }
                      onChange={(e) =>
                        cambiarRespuestaPropia(usuario, idx, e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Elige opción
                      </option>
                      {opciones.map((op, i) => (
                        <option key={i} value={i}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{display: "flex", marginTop: 10}}>
                    {opciones.map((opcion, i) => (
                      <div
                        key={i}
                        id={`${usuario}-${idx}-${i}`}
                        style={{
                          flex: 1,
                          minHeight: 60,
                          marginRight: 10,
                          border: "1px dashed #aaa",
                          borderRadius: 4,
                          padding: 8,
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <strong>{opcion}</strong>
                        <SortableContext
                          items={
                            respuestas[usuario]?.[idx]?.otros[i]
                              ? respuestas[usuario][idx].otros[i]
                              : []
                          }
                          strategy={verticalListSortingStrategy}
                        >
                          {(respuestas[usuario]?.[idx]?.otros[i] || []).map(
                            (userId) => (
                              <SortableUser key={userId} id={userId} />
                            )
                          )}
                        </SortableContext>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <DragOverlay>
            {activeId ? (
              <div
                style={{
                  padding: 10,
                  backgroundColor: "#ddd",
                  borderRadius: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {activeId}
              </div>
            ) : null}
          </DragOverlay>

          <h2>Resultados</h2>
          {usuarios.map((usuario) => (
            <div key={usuario} style={{marginBottom: 15}}>
              <h3>{usuario}</h3>
              <ul>
                {calcularResultados(usuario).map((r) => (
                  <li key={r.trastorno}>
                    {r.trastorno}: {r.porcentaje}%
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </DndContext>
      )}
    </div>
  );
}

export default App;
