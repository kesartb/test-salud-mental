// App con autoevaluación y evaluación cruzada (drag & drop)
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useState } from 'react';
import { DndContext, useDroppable, useDraggable } from '@dnd-kit/core';

const baseQuestions = [
  {
    id: 1,
    text: "¿Con qué frecuencia te sientes triste o sin esperanza?",
    options: ["Nunca", "Ocasionalmente", "Frecuentemente", "Siempre"],
    related: "Depresión"
  },
  {
    id: 2,
    text: "¿Tienes pensamientos acelerados o cambios de humor extremos?",
    options: ["Nunca", "Ocasionalmente", "Frecuentemente", "Siempre"],
    related: "Bipolaridad"
  },
  {
    id: 3,
    text: "¿Evitas situaciones sociales por miedo a ser juzgado o rechazado?",
    options: ["Nunca", "Ocasionalmente", "Frecuentemente", "Siempre"],
    related: "Ansiedad Social"
  },
];

let users = [];

function Home() {
  const [name, setName] = useState('');

  const handleAddUser = () => {
    if (name.trim()) {
      users.push({ name, answers: {}, peerAnswers: {} });
      setName('');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Registro de Usuarios</h1>
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button onClick={handleAddUser} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Añadir usuario
      </button>
      <div className="mt-4">
        <h2 className="font-bold">Usuarios registrados:</h2>
        <ul className="list-disc pl-6">
          {users.map((u, i) => <li key={i}>{u.name}</li>)}
        </ul>
      </div>
      <Link to="/test" className="mt-4 inline-block text-blue-600 underline">
        Comenzar test
      </Link>
    </div>
  );
}

function Test() {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [peerResponses, setPeerResponses] = useState({});

  const currentUser = users[currentUserIndex];

  const handleChange = (questionId, option) => {
    setResponses(prev => ({ ...prev, [questionId]: option }));
  };

  const handleDrop = (userName, questionId, option) => {
    setPeerResponses(prev => {
      const updated = { ...prev };
      if (!updated[userName]) updated[userName] = {};
      updated[userName][questionId] = option;
      return updated;
    });
  };

  const handleNext = () => {
    currentUser.answers = { ...responses };
    for (let peerName in peerResponses) {
      const peer = users.find(u => u.name === peerName);
      if (peer) {
        peer.peerAnswers[currentUser.name] = { ...peerResponses[peerName] };
      }
    }
    if (currentUserIndex < users.length - 1) {
      setResponses({});
      setPeerResponses({});
      setCurrentUserIndex(currentUserIndex + 1);
    } else {
      window.location.href = "/results";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test de Salud Mental</h1>
      <h2 className="font-semibold mb-2">Usuario: {currentUser.name}</h2>
      {baseQuestions.map(q => (
        <div key={q.id} className="mb-4">
          <p className="font-medium">{q.text}</p>
          <div className="space-y-2">
            {q.options.map(opt => (
              <div key={opt} className="border p-2 rounded bg-gray-100">
                <label className="font-medium">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={responses[q.id] === opt}
                    onChange={() => handleChange(q.id, opt)}
                    className="mr-2"
                  />
                  {opt}
                </label>
                <div className="flex flex-wrap mt-2 gap-2">
                  {users
                    .filter(u => u.name !== currentUser.name)
                    .map((u, i) => (
                      <DraggableUser
                        key={u.name + '-' + opt + '-' + i}
                        user={u.name}
                        onDrop={() => handleDrop(u.name, q.id, opt)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleNext} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">
        {currentUserIndex < users.length - 1 ? 'Siguiente usuario' : 'Ver resultados'}
      </button>
    </div>
  );
}

function DraggableUser({ user, onDrop }) {
  const { setNodeRef } = useDroppable({ id: user });
  const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({ id: user });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined;

  return (
    <div ref={setDragRef} {...listeners} {...attributes} style={style}
      className="cursor-move px-2 py-1 bg-blue-200 rounded">
      {user}
    </div>
  );
}

function Results() {
  const scores = users.map(user => {
    const counts = {};
    baseQuestions.forEach(q => {
      const answer = user.answers[q.id];
      if (!answer) return;
      const score = q.options.indexOf(answer);
      counts[q.related] = (counts[q.related] || 0) + score;
    });
    const peerAggregate = {};
    for (let peer in user.peerAnswers) {
      const answers = user.peerAnswers[peer];
      baseQuestions.forEach(q => {
        const answer = answers[q.id];
        if (!answer) return;
        const score = q.options.indexOf(answer);
        peerAggregate[q.related] = (peerAggregate[q.related] || 0) + score;
      });
    }
    return {
      name: user.name,
      selfScores: counts,
      peerScores: peerAggregate
    };
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resultados</h1>
      {scores.map((u, i) => (
        <div key={i} className="mb-4 border p-3 rounded shadow">
          <h2 className="font-semibold text-lg">{u.name}</h2>
          <p className="font-medium">Autoevaluación:</p>
          <ul className="list-disc ml-6 mb-2">
            {Object.entries(u.selfScores).map(([k, v]) => (
              <li key={k}>{k}: {(v / (baseQuestions.filter(q => q.related === k).length * 3) * 100).toFixed(1)}%</li>
            ))}
          </ul>
          <p className="font-medium">Evaluación por otros:</p>
          <ul className="list-disc ml-6">
            {Object.entries(u.peerScores).map(([k, v]) => (
              <li key={k}>{k}: {(v / (baseQuestions.filter(q => q.related === k).length * 3 * (users.length - 1)) * 100).toFixed(1)}%</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<DndContext><Test /></DndContext>} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
