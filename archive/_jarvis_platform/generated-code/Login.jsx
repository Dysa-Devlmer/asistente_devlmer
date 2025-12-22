import React, { useState } from 'react';
import './Login.css';

export default function Login() {
  const [formData, setFormData] = useState({
      "nombre": "",
      "email": "",
      "mensaje": ""
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre) {
      newErrors.nombre = 'Nombre es requerido';
    }
    if (!formData.email) {
      newErrors.email = 'Email es requerido';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implementar lógica de envío
    console.log('Datos del formulario:', formData);

    // Reset form
    setFormData({
        "nombre": "",
        "email": "",
        "mensaje": ""
    });
    setErrors({});
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">

      <div className="form-group">
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          placeholder="Ingrese su nombre"
          className="form-control"
        />
        {errors.nombre && <span className="error">{errors.nombre}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="correo@ejemplo.com"
          className="form-control"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="mensaje">Mensaje:</label>
        <input
          type="text"
          id="mensaje"
          name="mensaje"
          value={formData.mensaje}
          onChange={handleChange}
          
          placeholder="Su mensaje aquí..."
          className="form-control"
        />
        {errors.mensaje && <span className="error">{errors.mensaje}</span>}
      </div>

        <button type="submit" className="btn btn-primary">
          Enviar
        </button>
      </form>
    </div>
  );
}
