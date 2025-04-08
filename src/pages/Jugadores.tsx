import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import { getJugadores, getJugadoresPorEquipo, getEquipos, getTemporadas } from '../services/api';

const Jugadores = () => {
  const [jugadores, setJugadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    equipo: '',
    posicion: '',
    temporada: ''
  });
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Cargar usuario del localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuarioParsed = JSON.parse(usuarioGuardado);
        setUsuario(usuarioParsed);
        
        // Si el usuario es entrenador y tiene un equipo asignado, filtrar por ese equipo
        if (usuarioParsed.rol === 'Entrenador' && usuarioParsed.equipo) {
          setFiltros(prev => ({
            ...prev,
            equipo: usuarioParsed.equipo._id
          }));
        }
      } catch (err) {
        console.error('Error al parsear usuario:', err);
      }
    }

    // Cargar datos iniciales
    cargarDatos();
  }, []);

  // Efecto para recargar jugadores cuando cambian los filtros
  useEffect(() => {
    cargarJugadores();
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar equipos
      const resEquipos = await getEquipos();
      setEquipos(resEquipos.data);
      
      // Cargar temporadas
      const resTemporadas = await getTemporadas();
      setTemporadas(resTemporadas.data);
      
      // Establecer temporada activa como predeterminada
      const temporadaActiva = resTemporadas.data.find(t => t.activa);
      if (temporadaActiva) {
        setFiltros(prev => ({
          ...prev,
          temporada: temporadaActiva._id
        }));
      }
      
      // Cargar jugadores (se hará en el efecto cuando cambien los filtros)
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarJugadores = async () => {
    setLoading(true);
    setError('');
    
    try {
      let res;
      
      // Si hay un equipo seleccionado, filtrar por equipo
      if (filtros.equipo) {
        res = await getJugadoresPorEquipo(filtros.equipo);
      } else {
        // Si no, obtener todos los jugadores
        res = await getJugadores();
      }
      
      // Filtrar por posición si está seleccionada
      let jugadoresFiltrados = res.data;
      if (filtros.posicion) {
        jugadoresFiltrados = jugadoresFiltrados.filter(j => j.posicion === filtros.posicion);
      }
      
      setJugadores(jugadoresFiltrados);
    } catch (err) {
      console.error('Error al cargar jugadores:', err);
      setError('Error al cargar jugadores. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getNombreEquipo = (equipoId) => {
    if (!equipoId || !equipos.length) return 'No asignado';
    const equipo = equipos.find(e => e._id === equipoId);
    return equipo ? equipo.nombre : 'Equipo no encontrado';
  };

  const getTemporadaNombre = (temporadaId) => {
    if (!temporadaId || !temporadas.length) return 'Actual';
    const temporada = temporadas.find(t => t._id === temporadaId);
    return temporada ? temporada.nombre : 'Temporada no encontrada';
  };

  if (loading && !jugadores.length) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Cargando jugadores...</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestión de Jugadores</h5>
          <Button variant="primary" size="sm" href="/jugadores/nuevo">
            Nuevo Jugador
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Filtros */}
          <Row className="mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Temporada</Form.Label>
                <Form.Select 
                  name="temporada"
                  value={filtros.temporada}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todas las temporadas</option>
                  {temporadas.map(temporada => (
                    <option key={temporada._id} value={temporada._id}>
                      {temporada.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Equipo</Form.Label>
                <Form.Select 
                  name="equipo"
                  value={filtros.equipo}
                  onChange={handleFiltroChange}
                  disabled={usuario?.rol === 'Entrenador'} // Deshabilitar si es entrenador
                >
                  <option value="">Todos los equipos</option>
                  {equipos.map(equipo => (
                    <option key={equipo._id} value={equipo._id}>
                      {equipo.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Posición</Form.Label>
                <Form.Select 
                  name="posicion"
                  value={filtros.posicion}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todas las posiciones</option>
                  <option value="Portero">Portero</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Centrocampista">Centrocampista</option>
                  <option value="Delantero">Delantero</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {/* Tabla de jugadores */}
          {jugadores.length > 0 ? (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Equipo</th>
                  <th>Posición</th>
                  <th>Edad</th>
                  <th>Asistencia</th>
                  <th>Valoración</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map(jugador => (
                  <tr key={jugador._id}>
                    <td>{jugador.nombre} {jugador.apellidos}</td>
                    <td>{getNombreEquipo(jugador.equipo)}</td>
                    <td>{jugador.posicion}</td>
                    <td>{jugador.edad || calcularEdad(jugador.fechaNacimiento)}</td>
                    <td>{jugador.asistencia || '90%'}</td>
                    <td>{jugador.valoracionMedia || '7.5'}</td>
                    <td>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 me-2"
                        href={`/jugadores/${jugador._id}`}
                      >
                        Ver
                      </Button>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0"
                        href={`/jugadores/editar/${jugador._id}`}
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">
              No se encontraron jugadores con los filtros seleccionados.
            </Alert>
          )}
        </Card.Body>
      </Card>
      
      {/* Estadísticas */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Distribución por Posición</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div className="text-center">
                  <h3>{jugadores.filter(j => j.posicion === 'Portero').length}</h3>
                  <p className="text-muted">Porteros</p>
                </div>
                <div className="text-center">
                  <h3>{jugadores.filter(j => j.posicion === 'Defensa').length}</h3>
                  <p className="text-muted">Defensas</p>
                </div>
                <div className="text-center">
                  <h3>{jugadores.filter(j => j.posicion === 'Centrocampista').length}</h3>
                  <p className="text-muted">Centrocampistas</p>
                </div>
                <div className="text-center">
                  <h3>{jugadores.filter(j => j.posicion === 'Delantero').length}</h3>
                  <p className="text-muted">Delanteros</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Resumen</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div className="text-center">
                  <h3>{jugadores.length}</h3>
                  <p className="text-muted">Total Jugadores</p>
                </div>
                <div className="text-center">
                  <h3>{equipos.length}</h3>
                  <p className="text-muted">Equipos</p>
                </div>
                <div className="text-center">
                  <h3>{getTemporadaNombre(filtros.temporada)}</h3>
                  <p className="text-muted">Temporada</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Función auxiliar para calcular edad a partir de fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 'N/A';
  
  const hoy = new Date();
  const fechaNac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  
  return edad;
};

export default Jugadores;
