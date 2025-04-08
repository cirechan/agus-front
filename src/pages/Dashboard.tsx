import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { getEquipos, getJugadoresPorEquipo, getAsistenciasPorEquipo } from '../services/api';

interface Equipo {
  _id: string;
  nombre: string;
  categoria: string;
}

interface Jugador {
  _id: string;
  nombre: string;
  apellidos: string;
  posicion: string;
}

interface Asistencia {
  _id: string;
  jugador: string;
  presente: boolean;
  fecha: string;
}

interface Usuario {
  _id: string;
  nombreUsuario: string;
  rol: string;
  equipo?: {
    _id: string;
    nombre: string;
    categoria: string;
  };
}

const Dashboard = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [temporadaActual, setTemporadaActual] = useState<string>('2024-2025');

  useEffect(() => {
    // Cargar usuario del localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuarioParsed = JSON.parse(usuarioGuardado);
        setUsuario(usuarioParsed);
        
        // Si el usuario es entrenador y tiene un equipo asignado, seleccionarlo automáticamente
        if (usuarioParsed.rol === 'Entrenador' && usuarioParsed.equipo) {
          setEquipoSeleccionado(usuarioParsed.equipo._id);
        }
      } catch (err) {
        console.error('Error al parsear usuario:', err);
      }
    }

    // Cargar datos iniciales
    cargarDatos();
  }, []);

  // Efecto para cargar datos específicos del equipo cuando se selecciona uno
  useEffect(() => {
    if (equipoSeleccionado) {
      cargarDatosEquipo(equipoSeleccionado);
    }
  }, [equipoSeleccionado]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar equipos
      const resEquipos = await getEquipos();
      setEquipos(resEquipos.data);
      
      // Si no hay equipo seleccionado y hay equipos disponibles, seleccionar el primero
      if (!equipoSeleccionado && resEquipos.data.length > 0) {
        setEquipoSeleccionado(resEquipos.data[0]._id);
      }
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosEquipo = async (equipoId: string) => {
    try {
      // Cargar jugadores del equipo
      const resJugadores = await getJugadoresPorEquipo(equipoId);
      setJugadores(resJugadores.data);
      
      // Cargar asistencias del equipo
      const resAsistencias = await getAsistenciasPorEquipo(equipoId);
      setAsistencias(resAsistencias.data);
    } catch (err) {
      console.error('Error al cargar datos del equipo:', err);
      setError('Error al cargar datos del equipo seleccionado.');
    }
  };

  const cambiarEquipo = (equipoId: string) => {
    setEquipoSeleccionado(equipoId);
  };

  const getNombreEquipo = (): string => {
    if (!equipoSeleccionado || !equipos.length) return 'Cargando...';
    const equipo = equipos.find(e => e._id === equipoSeleccionado);
    return equipo ? equipo.nombre : 'Equipo no encontrado';
  };

  const calcularPorcentajeAsistencia = (): number => {
    if (!jugadores.length || !asistencias.length) return 0;
    
    // Lógica simplificada para calcular porcentaje de asistencia
    const totalAsistencias = asistencias.filter(a => a.presente).length;
    const totalPosibles = asistencias.length;
    
    return totalPosibles > 0 ? Math.round((totalAsistencias / totalPosibles) * 100) : 0;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Cargando datos del dashboard...</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Selector de temporada y equipo */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Temporada Actual</h5>
              <h3>{temporadaActual}</h3>
            </Col>
            <Col md={6}>
              <h5>Equipo</h5>
              <select 
                className="form-select" 
                value={equipoSeleccionado || ''}
                onChange={(e) => cambiarEquipo(e.target.value)}
              >
                <option value="">Selecciona un equipo</option>
                {equipos.map(equipo => (
                  <option key={equipo._id} value={equipo._id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Estadísticas principales */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6 className="text-muted">Jugadores</h6>
              <h2>{jugadores.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6 className="text-muted">Asistencia</h6>
              <h2>{calcularPorcentajeAsistencia()}%</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6 className="text-muted">Próximo Entrenamiento</h6>
              <h2>Hoy 18:00</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h6 className="text-muted">Valoración Media</h6>
              <h2>7.8</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Accesos rápidos */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Acciones Rápidas</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <Button variant="primary" className="w-100" href="/asistencias">
                    Registrar Asistencia
                  </Button>
                </Col>
                <Col md={4} className="mb-3">
                  <Button variant="outline-primary" className="w-100" href="/jugadores">
                    Ver Jugadores
                  </Button>
                </Col>
                <Col md={4} className="mb-3">
                  <Button variant="outline-primary" className="w-100" href="/valoraciones">
                    Valorar Jugadores
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Últimas actividades */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Últimos Jugadores</h5>
            </Card.Header>
            <Card.Body>
              {jugadores.length > 0 ? (
                <ul className="list-group">
                  {jugadores.slice(0, 5).map(jugador => (
                    <li key={jugador._id} className="list-group-item d-flex justify-content-between align-items-center">
                      {jugador.nombre} {jugador.apellidos}
                      <span className="badge bg-primary rounded-pill">{jugador.posicion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No hay jugadores registrados en este equipo.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Actividad Reciente</h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-group">
                <li className="list-group-item">
                  <p className="mb-1"><strong>Registro de asistencia</strong></p>
                  <p className="text-muted mb-0">Equipo: {getNombreEquipo()} - Fecha: {new Date().toLocaleDateString()}</p>
                </li>
                <li className="list-group-item">
                  <p className="mb-1"><strong>Nueva valoración</strong></p>
                  <p className="text-muted mb-0">Jugador: Carlos Martínez - Valoración: 8.5</p>
                </li>
                <li className="list-group-item">
                  <p className="mb-1"><strong>Nuevo jugador registrado</strong></p>
                  <p className="text-muted mb-0">Equipo: {getNombreEquipo()} - Jugador: Ana García</p>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
