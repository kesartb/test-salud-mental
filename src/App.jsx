import React, { useState } from 'react';

const trastornos = [
  "Depresión mayor",
  "Trastorno de ansiedad generalizada",
  "Trastorno bipolar",
  "Trastorno obsesivo-compulsivo (TOC)",
  "Trastorno de estrés postraumático (TEPT)",
  "Esquizofrenia",
  "Trastorno límite de la personalidad",
  "Trastorno de la alimentación",
  "TDAH",
  "Trastorno del espectro autista",
  "Fobia social",
  "Trastorno de pánico"
];

const preguntas = [
  {
    texto: "¿Con qué frecuencia sientes tristeza sin motivo aparente?",
    trastorno: "Depresión mayor"
  },
  {
    texto: "¿Te preocupas excesivamente por situaciones cotidianas?",
    trastorno: "Trastorno de ansiedad generalizada"
  },
  {
    texto: "¿Tienes cambios de humor muy extremos sin razón clara?",
    trastorno: "Trastorno bipolar"
  },
  {
    texto: "¿Repites pensamientos o comportamientos aunque no quieras?",
    trastorno: "Trastorno obsesivo-compulsivo (TOC)"
  },
  {
    texto: "¿Tienes recuerdos o pesadillas intrusivas sobre eventos pasados?",
    trastorno: "Trastorno de estrés postraumático (TEPT)"
  },
  {
    texto: "¿Sientes que escuchas o ves cosas que otros no perciben?",
    trastorno: "Esquizofrenia"
  }
];

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fase, setFase] = useState('registro');
  const [respuestas, setRespuestas] = useState({});

  const agregarUsuario = () => {
    if (nombreUsuario && !usuarios.includes(nombreUsuario)) {
      setUsuarios([...usuarios, nombreUsuario]);
      setNombreUsuario('');
    }
  };

  const iniciarTest = () => {
    const estructura = {};
    for (const usuario of usuarios) {
      estructura[usuario] = preguntas.map(() => ({ self: '', otros: {} }));
    }
    setRespuestas(estructura);
    setFase('test');
  };

  const guardarRespuesta = (usuario, index, tipo, valor) => {
    setRespuestas(prev => {
      const copia = { ...prev };
      if (!copia[usuario][index]) copia[usuario][index] = { self: '', otros: {} };
      if (tipo === 'self') {
        copia[usuario][index].self = valor;
      }
      return copia;
    });
  };

  const asignarRespuestaOtro = (quienResponde, aQuien, index, valor) => {
    setRespuestas(prev => {
      const copia = { ...prev };
      if (!copia[aQuien][index]) copia[aQuien][index] = { self: '', otros: {} };
      copia[aQuien][index].otros[quienResponde] = valor;
      return copia;
    });
  };

  const calcularResultados = (usuario) => {
    const cuenta = {};
    for (const p of preguntas) {
      cuenta[p.trastorno] = 0;
    }

    respuestas[usuario]?.forEach((r, i) => {
      if (r.self === 'sí') {
        cuenta[preguntas[i].trastorno] += 1;
      }
      for (const val of Object.values(r.otros)) {
        if (val === 'sí') cuenta[preguntas[i].trastorno] += 1;
      }
    });

    const total = preguntas.length * (1 + usuarios.length - 1); // self + otros
    const porcentajes = Object.entries(cuenta).map(([k, v]) => ({
      trastorno: k,
      porcentaje: Math.round((v / total) * 100)
    }));

    return porcentajes.sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 3);
  };

  return (
    <div>
      <h1>Test de Salud Mental</h1>

      {fase === 'registro' && (
        <>
          <input
            placeholder="Nombre de usuario"
            value={nombreUsuario}
            onChange={e => setNombreUsuario(e.target.value)}
          />
          <button onClick={agregarUsuario}>Agregar</button>
          <ul>
            {usuarios.map(u => <li key={u}>{u}</li>)}
          </ul>
          {usuarios.length >= 2 && (
            <button onClick={iniciarTest}>Comenzar test</button>
          )}
        </>
      )}

      {fase === 'test' && (
        <>
          {usuarios.map(usuario => (
            <div key={usuario} style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem' }}>
              <h3>Respuestas de {usuario}</h3>
              {preguntas.map((pregunta, i) => (
                <div key={i}>
                  <p>{pregunta.texto}</p>
                  <label>
                    ¿{usuario} se siente así?
                    <select
                      value={respuestas[usuario][i]?.self || ''}
                      onChange={e => guardarRespuesta(usuario, i, 'self', e.target.value)}
                    >
                      <option value="">Elige</option>
                      <option value="sí">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </label>

                  <div style={{ marginLeft: '1rem' }}>
                    <strong>¿Quién más se lo nota a {usuario}?</strong>
                    {usuarios.filter(u => u !== usuario).map(otro => (
                      <div key={otro}>
                        {otro} opina:
                        <select
                          value={respuestas[usuario][i]?.otros?.[otro] || ''}
                          onChange={e => asignarRespuestaOtro(otro, usuario, i, e.target.value)}
                        >
                          <option value="">Elige</option>
                          <option value="sí">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <h2>Resultados</h2>
          {usuarios.map(usuario => (
            <div key={usuario}>
              <h3>{usuario}</h3>
              <ul>
                {calcularResultados(usuario).map(res => (
                  <li key={res.trastorno}>
                    {res.trastorno}: {res.porcentaje}%
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
