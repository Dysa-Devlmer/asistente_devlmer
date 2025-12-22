import React from 'react';
import PosAssistant from '../../components/PosAssistant';

function JarvisAssistant() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Asistente POS</h2>
        <p className="text-sm text-gray-400">
          Modulo interno de ayuda. Sin dashboard.
        </p>
      </div>
      <PosAssistant />
    </section>
  );
}

export default JarvisAssistant;
