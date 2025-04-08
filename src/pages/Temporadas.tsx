import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

interface Temporada {
  _id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

const Temporadas = () => {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentTemporada, setCurrentTemporada] = useState<Partial<Temporada>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Cargar temporadas al montar el componente
  useEffect(() => {
    const cargarTemporadas = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/temporadas');
        setTemporadas(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar temporadas:', err);
        setError('Error al cargar las temporadas. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    cargarTemporadas();
  }, []);

  // Abrir modal para crear nueva temporada
  const handleNuevaTemporada = () => {
    setCurrentTemporada({
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      activa: false
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // Abrir modal para editar temporada existente
  const handleEditarTemporada = (temporada: Temporada) => {
    setCurrentTemporada({
      ...temporada,
      fechaInicio: new Date(temporada.fechaInicio).toISOString().split('T')[0],
      fechaFin: new Date(temporada.fechaFin).toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Guardar temporada (crear o actualizar)
  const handleGuardarTemporada = async () => {
    try {
      if (!currentTemporada.nombre || !currentTemporada.fechaInicio || !currentTemporada.fechaFin) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }
      
      if (isEditing && currentTemporada._id) {
        // Actualizar temporada existente
        await axios.put(`http://localhost:5000/api/temporadas/${currentTemporada._id}`, currentTemporada);
        
        // Actualizar lista de temporadas
        setTemporadas(temporadas.map(t => t._id === currentTemporada._id ? {...t, ...currentTemporada} : t));
      } else {
        // Crear nueva temporada
        const response = await axios.post('http://localhost:5000/api/temporadas', currentTemporada);
        
        // Añadir a la lista de temporadas
        setTemporadas([...temporadas, response.data]);
      }
      
      // Cerrar modal
      setShowModal(false);
      setCurrentTemporada({});
    } catch (err) {
      console.error('Error al guardar temporada:', err);
      setError('Error al guardar la temporada. Por favor, intenta de nuevo.');
    }
  };

  // Activar temporada
  const handleActivarTemporada = async (id: string) => {
    try {
      await axios.put(`http://localhost:5000/api/temporadas/${id}`, { activa: true });
      
      // Actualizar lista de temporadas
      setTemporadas(temporadas.map(t => ({
        ...t,
        activa: t._id === id
      })));
    } catch (err) {
      console.error('Error al activar temporada:', err);
      setError('Error al activar la temporada. Por favor, intenta de nuevo.');
    }
  };

  // Eliminar temporada
  const handleEliminarTemporada = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta temporada? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`http://localhost:5000/api/temporadas/${id}`);
        
        // Actualizar lista de temporadas
        setTemporadas(temporadas.filter(t => t._id !== id));
      } catch (err) {
        console.error('Error al eliminar temporada:', err);
        setError('Error al eliminar la temporada. Por favor, intenta de nuevo.');
      }
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentTemporada({
      ...currentTemporada,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) {
    return <div className="text-center p-5">Cargando temporadas...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Temporadas</h2>
        <Button variant="primary" onClick={handleNuevaTemporada}>
          Nueva Temporada
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          {temporadas.length > 0 ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {temporadas.map(temporada => (
                  <tr key={temporada._id}>
                    <td>{temporada.nombre}</td>
                    <td>{new Date(temporada.fechaInicio).toLocaleDateString()}</td>
                    <td>{new Date(temporada.fechaFin).toLocaleDateString()}</td>
                    <td>
                      {temporada.activa ? (
                        <Badge bg="success">Activa</Badge>
                      ) : (
                        <Badge bg="secondary">Inactiva</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditarTemporada(temporada)}
                      >
                        Editar
                      </Button>
                      {!temporada.activa && (
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          className="me-2"
                          onClick={() => handleActivarTemporada(temporada._id)}
                        >
                          Activar
                        </Button>
                      )}
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleEliminarTemporada(temporada._id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-muted">No hay temporadas registradas</p>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal para crear/editar temporada */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Temporada' : 'Nueva Temporada'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={currentTemporada.nombre || ''}
                onChange={handleInputChange}
                placeholder="Ej: 2024-2025"
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Inicio *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaInicio"
                    value={currentTemporada.fechaInicio || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Fin *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaFin"
                    value={currentTemporada.fechaFin || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Temporada Activa"
                name="activa"
                checked={currentTemporada.activa || false}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                Al activar esta temporada, se desactivarán automáticamente las demás.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarTemporada}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Temporadas;
