import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

interface Equipo {
  _id: string;
  nombre: string;
  categoria: string;
  temporada: string;
  entrenador: string;
  limiteJugadores: number;
}

interface Temporada {
  _id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

interface Usuario {
  _id: string;
  nombreUsuario: string;
  rol: string;
}

const Equipos = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentEquipo, setCurrentEquipo] = useState<Partial<Equipo>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Cargar equipos, temporadas y usuarios al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar equipos
        const equiposResponse = await axios.get('http://localhost:5000/api/equipos');
        setEquipos(equiposResponse.data);
        
        // Cargar temporadas para el formulario
        const temporadasResponse = await axios.get('http://localhost:5000/api/temporadas');
        setTemporadas(temporadasResponse.data);
        
        // Cargar usuarios (entrenadores) para el formulario
        const usuariosResponse = await axios.get('http://localhost:5000/api/usuarios');
        setUsuarios(usuariosResponse.data.filter((u: Usuario) => u.rol === 'Entrenador'));
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Abrir modal para crear nuevo equipo
  const handleNuevoEquipo = () => {
    setCurrentEquipo({});
    setIsEditing(false);
    setShowModal(true);
  };

  // Abrir modal para editar equipo existente
  const handleEditarEquipo = (equipo: Equipo) => {
    setCurrentEquipo({...equipo});
    setIsEditing(true);
    setShowModal(true);
  };

  // Guardar equipo (crear o actualizar)
  const handleGuardarEquipo = async () => {
    try {
      if (!currentEquipo.nombre || !currentEquipo.categoria || !currentEquipo.temporada) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }
      
      if (isEditing && currentEquipo._id) {
        // Actualizar equipo existente
        await axios.put(`http://localhost:5000/api/equipos/${currentEquipo._id}`, currentEquipo);
        
        // Actualizar lista de equipos
        setEquipos(equipos.map(e => e._id === currentEquipo._id ? {...e, ...currentEquipo} : e));
      } else {
        // Crear nuevo equipo
        const response = await axios.post('http://localhost:5000/api/equipos', currentEquipo);
        
        // Añadir a la lista de equipos
        setEquipos([...equipos, response.data]);
      }
      
      // Cerrar modal
      setShowModal(false);
      setCurrentEquipo({});
    } catch (err) {
      console.error('Error al guardar equipo:', err);
      setError('Error al guardar el equipo. Por favor, intenta de nuevo.');
    }
  };

  // Eliminar equipo
  const handleEliminarEquipo = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      try {
        await axios.delete(`http://localhost:5000/api/equipos/${id}`);
        
        // Actualizar lista de equipos
        setEquipos(equipos.filter(e => e._id !== id));
      } catch (err) {
        console.error('Error al eliminar equipo:', err);
        setError('Error al eliminar el equipo. Por favor, intenta de nuevo.');
      }
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentEquipo({
      ...currentEquipo,
      [name]: value
    });
  };

  if (loading) {
    return <div className="text-center p-5">Cargando equipos...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Equipos</h2>
        <Button variant="primary" onClick={handleNuevoEquipo}>
          Nuevo Equipo
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          {equipos.length > 0 ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Temporada</th>
                  <th>Entrenador</th>
                  <th>Límite Jugadores</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map(equipo => (
                  <tr key={equipo._id}>
                    <td>{equipo.nombre}</td>
                    <td>{equipo.categoria}</td>
                    <td>
                      {temporadas.find(t => t._id === equipo.temporada)?.nombre || 'No asignada'}
                    </td>
                    <td>
                      {usuarios.find(u => u._id === equipo.entrenador)?.nombreUsuario || 'No asignado'}
                    </td>
                    <td>{equipo.limiteJugadores}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditarEquipo(equipo)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleEliminarEquipo(equipo._id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-muted">No hay equipos registrados</p>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal para crear/editar equipo */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={currentEquipo.nombre || ''}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Categoría *</Form.Label>
              <Form.Select
                name="categoria"
                value={currentEquipo.categoria || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar categoría</option>
                <option value="Prebenjamín">Prebenjamín</option>
                <option value="Benjamín">Benjamín</option>
                <option value="Alevín">Alevín</option>
                <option value="Infantil">Infantil</option>
                <option value="Cadete">Cadete</option>
                <option value="Juvenil">Juvenil</option>
                <option value="Regional">Regional</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Temporada *</Form.Label>
              <Form.Select
                name="temporada"
                value={currentEquipo.temporada || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar temporada</option>
                {temporadas.map(temporada => (
                  <option key={temporada._id} value={temporada._id}>
                    {temporada.nombre} {temporada.activa ? '(Activa)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Entrenador</Form.Label>
              <Form.Select
                name="entrenador"
                value={currentEquipo.entrenador || ''}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar entrenador</option>
                {usuarios.map(usuario => (
                  <option key={usuario._id} value={usuario._id}>
                    {usuario.nombreUsuario}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Límite de Jugadores</Form.Label>
              <Form.Control
                type="number"
                name="limiteJugadores"
                value={currentEquipo.limiteJugadores || ''}
                onChange={handleInputChange}
                placeholder="Automático según categoría"
              />
              <Form.Text className="text-muted">
                Si no se especifica, se asignará automáticamente según la categoría.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarEquipo}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Equipos;
