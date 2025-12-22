// utils/formatter.js
// Formateo de respuestas

class Formatter {
  response(data) {
    return `\n${data.analysis}\n\n✅ Se ejecutaron ${data.actionsCount} acciones`;
  }

  error(message) {
    return `\n❌ ${message}`;
  }
}

export default Formatter;
