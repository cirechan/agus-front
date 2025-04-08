import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

interface Jugador {
  _id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  posicion: string;
  dorsal: number;
  equipo: string;
  observaciones: string;
}

interface Equipo {
  _id: string;
  nombre: string;
  categoria: string;
}

const Jugadores = () => {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentJugador, setCurrentJugador] = useState<Partial<Jugador>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Cargar jugadores y equipos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar jugadores
        const jugadoresResponse = await getJugadores();
        setJugadores(jugadoresResponse.data);
        
        // Cargar equipos para el formulario
        const equiposResponse = await axios.get('http://localhost:5000/api/equipos');
        setEquipos(equiposResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Abrir modal para crear nuevo jugador
  const handleNuevoJugador = () => {
    setCurrentJugador({});
    setIsEditing(false);
    setShowModal(true);
  };

  // Abrir modal para editar jugador existente
  const handleEditarJugador = (jugador: Jugador) => {
    setCurrentJugador({...jugador});
    setIsEditing(true);
    setShowModal(true);
  };

  // Guardar jugador (crear o actualizar)
  const handleGuardarJugador = async () => {
    try {
      if (!currentJugador.nombre || !currentJugador.apellidos || !currentJugador.fechaNacimiento || !currentJugador.posicion || !currentJugador.equipo) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }
      
      if (isEditing && currentJugador._id) {
        // Actualizar jugador existente
        await axios.put(`http://localhost:5000/api/jugadores/${currentJugador._id}`, currentJugador);
        
        // Actualizar lista de jugadores
        setJugadores(jugadores.map(j => j._id === currentJugador._id ? {...j, ...currentJugador} : j));
      } else {
        // Crear nuevo jugador
        const response = await axios.post('http://localhost:5000/api/jugadores', currentJugador);
        
        // Añadir a la lista de jugadores
        setJugadores([...jugadores, response.data]);
      }
      
      // Cerrar modal
      setShowModal(false);
      setCurrentJugador({});
    } catch (err) {
      console.error('Error al guardar jugador:', err);
      setError('Error al guardar el jugador. Por favor, intenta de nuevo.');
    }
  };

  // Eliminar jugador
  const handleEliminarJugador = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este jugador?')) {
      try {
        await axios.delete(`http://localhost:5000/api/jugadores/${id}`);
        
        // Actualizar lista de jugadores
        setJugadores(jugadores.filter(j => j._id !== id));
      } catch (err) {
        console.error('Error al eliminar jugador:', err);
        setError('Error al eliminar el jugador. Por favor, intenta de nuevo.');
      }
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentJugador({
      ...currentJugador,
      [name]: value
    });
  };

  if (loading) {
    return <div className="text-center p-5">Cargando jugadores...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Jugadores</h2>
        <Button variant="primary" onClick={handleNuevoJugador}>
          Nuevo Jugador
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          {jugadores.length > 0 ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Posición</th>
                  <th>Dorsal</th>
                  <th>Fecha Nacimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map(jugador => (
                  <tr key={jugador._id}>
                    <td>{jugador.nombre} {jugador.apellidos}</td>
                    <td>{jugador.posicion}</td>
                    <td>{jugador.dorsal}</td>
                    <td>{new Date(jugador.fechaNacimiento).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditarJugador(jugador)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleEliminarJugador(jugador._id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-muted">No hay jugadores registrados</p>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal para crear/editar jugador */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={currentJugador.nombre || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos *</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellidos"
                    value={currentJugador.apellidos || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Nacimiento *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaNacimiento"
                    value={currentJugador.fechaNacimiento ? new Date(currentJugador.fechaNacimiento).toISOString().split('T')[0] : ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Posición *</Form.Label>
                  <Form.Select
                    name="posicion"
                    value={currentJugador.posicion || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar posición</option>
                    <option value="Portero">Portero</option>
                    <option value="Defensa">Defensa</option>
                    <option value="Centrocampista">Centrocampista</option>
                    <option value="Delantero">Delantero</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dorsal</Form.Label>
                  <Form.Control
                    type="number"
                    name="dorsal"
                    value={currentJugador.dorsal || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Equipo *</Form.Label>
                  <Form.Select
                    name="equipo"
                    value={currentJugador.equipo || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar equipo</option>
                    {equipos.map(equipo => (
                      <option key={equipo._id} value={equipo._id}>
                        {equipo.nombre} ({equipo.categoria})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observaciones"
                value={currentJugador.observaciones || ''}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarJugador}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Jugadores;
