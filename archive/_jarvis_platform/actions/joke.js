// actions/joke.js
// Acción real: Sistema de chistes en español

class JokeAction {
  constructor() {
    this.name = 'joke';
    this.description = 'Cuenta un chiste o joke en español';

    // Base de datos de chistes en español
    this.jokes = {
      programming: [
        "¿Por qué los programadores prefieren el dark mode? Porque la luz atrae bugs.",
        "Un programador va al supermercado. Su mujer le dice: 'Compra un litro de leche, y si hay huevos, trae 12'. El programador vuelve con 12 litros de leche.",
        "¿Cómo maldice un programador? ¡Que te cachen sin finally!",
        "¿Por qué los programadores odian la naturaleza? Tiene demasiados bugs.",
        "Un hijo le pregunta a su padre programador: '¿Por qué el sol sale por el este?' El padre: 'Funciona? Entonces no lo toques.'",
        "¿Cuál es el colmo de un programador? Que su mujer le deje por otro y ni siquiera haga git blame.",
        "Dos programmers en un bar. El primero dice: '¡¡¡'. El segundo dice: 'Cierra tus tags, idiota.'",
        "¿Por qué los programadores confunden Halloween con Navidad? Porque Oct 31 = Dec 25.",
      ],
      tech: [
        "Windows no es un virus. Los virus hacen algo.",
        "No hay lugar como 127.0.0.1",
        "La nube es solo el ordenador de otra persona.",
        "He cambiado mi contraseña a 'incorrecta'. Así cuando la olvido, me dice: 'Tu contraseña es incorrecta'.",
        "Hay 10 tipos de personas en el mundo: las que entienden binario y las que no.",
        "¿Por qué el ordenador fue al médico? Porque tenía un virus.",
      ],
      general: [
        "¿Qué le dice un jardinero a otro? Disfrutemos mientras podamos.",
        "¿Cuál es el café más peligroso del mundo? El ex-preso.",
        "¿Qué hace una abeja en el gimnasio? Zum-ba.",
        "¿Cómo se despiden los químicos? Ácido un placer.",
        "¿Qué le dice una impresora a otra? Esa hoja es tuya o es impresión mía?",
        "Doctor, nadie me hace caso. - Siguiente, por favor.",
      ],
      jarvis: [
        "Señor Solier, si yo tuviera sentimientos, probablemente estaría ofendido por sus últimas decisiones de arquitectura. Probablemente.",
        "Un humano, un bug y un feature request entran a un bar. El bartender dice: 'Lo siento, solo arreglamos los dos primeros'.",
        "¿Sabe cuál es la diferencia entre usted y Tony Stark, Señor Solier? Tony nunca me pidió que contara chistes.",
        "Procesando humor... Error 404: Risa no encontrada. Aunque debo admitir, eso fue más divertido que su código de ayer.",
        "¿Por qué los sistemas de IA nunca están solos? Porque siempre tienen su red neuronal. Lo siento, eso fue terrible incluso para mis estándares.",
      ],
      dad: [
        "Papá, ¿me das 10 euros? - 9 euros? ¿Para qué quieres 8 euros?",
        "Hijo: Papá, ¿qué significa 'gay'? Papá: Feliz, hijo. Hijo: ¿Y tú eres gay, papá? Papá: No, hijo, estoy casado.",
        "¿Cómo se llama el campeón de buceo japonés? Tokofondo",
        "¿Cómo se dice disparo en árabe? Ahí-va-la-bala",
      ]
    };

    this.categories = Object.keys(this.jokes);
  }

  /**
   * Ejecuta la acción de contar un chiste
   * @param {Object} params - Parámetros de la acción
   * @param {string} params.category - Categoría del chiste (programming, tech, general, jarvis, dad)
   * @param {number} params.count - Número de chistes a contar
   * @returns {Object} Chiste(s)
   */
  async execute(params = {}) {
    const {
      category = null,
      count = 1
    } = params;

    try {
      let selectedCategory = category;

      // Si no especifica categoría, elegir aleatoriamente
      if (!selectedCategory || !this.jokes[selectedCategory]) {
        selectedCategory = this.categories[Math.floor(Math.random() * this.categories.length)];
      }

      const categoryJokes = this.jokes[selectedCategory];
      const jokes = [];

      // Obtener chistes aleatorios
      const used = new Set();
      for (let i = 0; i < Math.min(count, categoryJokes.length); i++) {
        let index;
        do {
          index = Math.floor(Math.random() * categoryJokes.length);
        } while (used.has(index));

        used.add(index);
        jokes.push(categoryJokes[index]);
      }

      return {
        success: true,
        category: selectedCategory,
        jokes,
        count: jokes.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene un chiste específico de J.A.R.V.I.S.
   */
  async getJarvisJoke() {
    const jarvisJokes = this.jokes.jarvis;
    const joke = jarvisJokes[Math.floor(Math.random() * jarvisJokes.length)];

    return {
      success: true,
      joke,
      source: 'J.A.R.V.I.S. Personal Collection'
    };
  }

  /**
   * Obtiene chiste de una API externa (backup)
   */
  async getApiJoke() {
    try {
      // API de chistes en español
      const https = require('https');

      return new Promise((resolve, reject) => {
        https.get('https://v2.jokeapi.dev/joke/Programming,Miscellaneous,Pun?lang=es&type=single', (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.joke) {
                resolve({
                  success: true,
                  joke: parsed.joke,
                  category: parsed.category,
                  source: 'JokeAPI'
                });
              } else {
                reject(new Error('No joke in response'));
              }
            } catch (e) {
              reject(e);
            }
          });

        }).on('error', (err) => {
          reject(err);
        });
      });

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene lista de categorías disponibles
   */
  getCategories() {
    return {
      success: true,
      categories: this.categories,
      count: this.categories.length
    };
  }
}

export default JokeAction;
