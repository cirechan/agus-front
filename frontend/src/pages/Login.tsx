import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombreUsuario.trim()) {
      setError('Por favor ingresa un nombre de usuario');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // En un MVP sin login complejo, simplemente verificamos si el usuario existe
      const response = await axios.post('http://localhost:5000/api/usuarios/acceso', {
        nombreUsuario
      });
      
      // Guardar información del usuario en localStorage
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Usuario no encontrado. Por favor verifica el nombre de usuario.');
      console.error('Error de acceso:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Acceso al Sistema</Card.Title>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de Usuario</Form.Label>
              <Form.Control
                type="text"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Ingresa tu nombre de usuario"
                required
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100" 
              disabled={loading}
            >
              {loading ? 'Accediendo...' : 'Acceder'}
            </Button>
          </Form>
          
          <div className="mt-3 text-center">
            <small className="text-muted">
              MVP sin login complejo para pruebas de funcionalidades
            </small>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;
