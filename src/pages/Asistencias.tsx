import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import { getAsistenciasPorEquipo, getEquipos, getTemporadas, guardarAsistencias } from '../services/api';

const Asistencias = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtros, setFiltros] = useState({
    equipo: '',
    fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    temporada: ''
  });
  const [usuario, setUsuario] = useState(null);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [asistenciasRegistro, setAsistenciasRegistro] = useState([]);

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

  // Efecto para recargar asistencias cuando cambian los filtros
  useEffect(() => {
    if (filtros.equipo) {
      cargarAsistencias();
    }
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
      
      // Si hay un equipo seleccionado, cargar asistencias
      if (filtros.equipo) {
        cargarAsistencias();
      }
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      setError('Error al cargar datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarAsistencias = async () => {
    if (!filtros.equipo) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Cargar asistencias del equipo
      const res = await getAsistenciasPorEquipo(filtros.equipo);
      
      // Filtrar por fecha si está seleccionada
      let asistenciasFiltradas = res.data;
      if (filtros.fecha) {
        const fechaSeleccionada = new Date(filtros.fecha).toISOString().split('T')[0];
        asistenciasFiltradas = asistenciasFiltradas.filter(a => 
          new Date(a.fecha).toISOString().split('T')[0] === fechaSeleccionada
        );
      }
      
      setAsistencias(asistenciasFiltradas);
      
      // Extraer jugadores únicos de las asistencias para el modo de registro
      const jugadoresUnicos = [...new Set(asistenciasFiltradas.map(a => a.jugador))];
      setJugadores(jugadoresUnicos);
      
      // Preparar datos para el modo de registro
      const asistenciasParaRegistro = jugadoresUnicos.map(jugadorId => {
        const asistenciaExistente = asistenciasFiltradas.find(a => a.jugador === jugadorId);
        return {
          jugador: jugadorId,
          presente: asistenciaExistente ? asistenciaExistente.presente : true,
          motivo: asistenciaExistente ? asistenciaExistente.motivo : '',
          fecha: filtros.fecha,
          equipo: filtros.equipo
        };
      });
      
      setAsistenciasRegistro(asistenciasParaRegistro);
    } catch (err) {
      console.error('Error al cargar asistencias:', err);
      setError('Error al cargar asistencias. Por favor, intenta nuevamente.');
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

  const toggleModoRegistro = () => {
    setModoRegistro(!modoRegistro);
    if (!modoRegistro) {
      // Preparar datos para el registro
      cargarAsistencias();
    }
  };

  const handleAsistenciaChange = (index, campo, valor) => {
    const nuevasAsistencias = [...asistenciasRegistro];
    nuevasAsistencias[index][campo] = valor;
    setAsistenciasRegistro(nuevasAsistencias);
  };

  const guardarRegistroAsistencias = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Enviar asistencias al servidor
      await guardarAsistencias({
        asistencias: asistenciasRegistro,
        fecha: filtros.fecha,
        equipo: filtros.equipo
      });
      
      setSuccess('Asistencias guardadas correctamente');
      
      // Recargar asistencias
      cargarAsistencias();
      
      // Salir del modo registro
      setModoRegistro(false);
    } catch (err) {
      console.error('Error al guardar asistencias:', err);
      setError('Error al guardar asistencias. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getNombreEquipo = (equipoId) => {
    if (!equipoId || !equipos.length) return 'No asignado';
    const equipo = equipos.find(e => e._id === equipoId);
    return equipo ? equipo.nombre : 'Equipo no encontrado';
  };

  const getNombreJugador = (jugadorId) => {
    // En un caso real, esto vendría de una lista de jugadores cargada
    // Para este ejemplo, usamos un placeholder
    return `Jugador ${jugadorId.substring(0, 5)}`;
  };

  const calcularEstadisticas = () => {
    if (!asistencias.length) return { presentes: 0, ausentes: 0, porcentaje: 0 };
    
    const presentes = asistencias.filter(a => a.presente).length;
    const total = asistencias.length;
    const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;
    
    return {
      presentes,
      ausentes: total - presentes,
      porcentaje
    };
  };

  const estadisticas = calcularEstadisticas();

  if (loading && !asistencias.length && !equipos.length) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Cargando datos de asistencias...</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Control de Asistencias</h5>
          <Button 
            variant={modoRegistro ? "secondary" : "primary"} 
            size="sm"
            onClick={toggleModoRegistro}
          >
            {modoRegistro ? "Cancelar Registro" : "Registrar Asistencia"}
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
                  disabled={modoRegistro}
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
                  disabled={usuario?.rol === 'Entrenador' || modoRegistro} // Deshabilitar si es entrenador o está en modo registro
                >
                  <option value="">Selecciona un equipo</option>
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
                <Form.Label>Fecha</Form.Label>
                <Form.Control 
                  type="date"
                  name="fecha"
                  value={filtros.fecha}
                  onChange={handleFiltroChange}
                  disabled={modoRegistro}
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Estadísticas de asistencia */}
          {filtros.equipo && asistencias.length > 0 && !modoRegistro && (
            <Row className="mb-4">
              <Col md={4}>
                <Card className="text-center">
                  <Card.Body>
                    <h6 className="text-muted">Asistencia</h6>
                    <h2>{estadisticas.porcentaje}%</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center">
                  <Card.Body>
                    <h6 className="text-muted">Presentes</h6>
                    <h2>{estadisticas.presentes}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center">
                  <Card.Body>
                    <h6 className="text-muted">Ausentes</h6>
                    <h2>{estadisticas.ausentes}</h2>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          {/* Modo visualización */}
          {!modoRegistro && filtros.equipo && (
            <>
              {asistencias.length > 0 ? (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th>Estado</th>
                      <th>Motivo</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map(asistencia => (
                      <tr key={asistencia._id || asistencia.jugador}>
                        <td>{getNombreJugador(asistencia.jugador)}</td>
                        <td>
                          <span className={`badge ${asistencia.presente ? 'bg-success' : 'bg-danger'}`}>
                            {asistencia.presente ? 'Presente' : 'Ausente'}
                          </span>
                        </td>
                        <td>{asistencia.motivo || '-'}</td>
                        <td>{new Date(asistencia.fecha).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No hay registros de asistencia para la fecha y equipo seleccionados.
                </Alert>
              )}
            </>
          )}
          
          {/* Modo registro */}
          {modoRegistro && filtros.equipo && (
            <>
              <h6 className="mb-3">Registro de Asistencia - {getNombreEquipo(filtros.equipo)} - {new Date(filtros.fecha).toLocaleDateString()}</h6>
              
              {asistenciasRegistro.length > 0 ? (
                <>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Jugador</th>
                        <th>Estado</th>
                        <th>Motivo de Ausencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistenciasRegistro.map((asistencia, index) => (
                        <tr key={index}>
                          <td>{getNombreJugador(asistencia.jugador)}</td>
                          <td>
                            <Form.Check 
                              type="switch"
                              id={`asistencia-${index}`}
                              label={asistencia.presente ? "Presente" : "Ausente"}
                              checked={asistencia.presente}
                              onChange={(e) => handleAsistenciaChange(index, 'presente', e.target.checked)}
                            />
                          </td>
                          <td>
                            <Form.Select
                              value={asistencia.motivo}
                              onChange={(e) => handleAsistenciaChange(index, 'motivo', e.target.value)}
                              disabled={asistencia.presente}
                            >
                              <option value="">Seleccionar motivo</option>
                              <option value="Enfermedad">Enfermedad</option>
                              <option value="Lesión">Lesión</option>
                              <option value="Familiar">Motivo familiar</option>
                              <option value="Estudios">Estudios</option>
                              <option value="Otro">Otro</option>
                            </Form.Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  <div className="d-flex justify-content-end mt-3">
                    <Button 
                      variant="secondary" 
                      className="me-2"
                      onClick={() => setModoRegistro(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={guardarRegistroAsistencias}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Asistencias'}
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="warning">
                  No hay jugadores disponibles para registrar asistencia en este equipo.
                </Alert>
              )}
            </>
          )}
          
          {!filtros.equipo && (
            <Alert variant="info">
              Selecciona un equipo para ver o registrar asistencias.
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Asistencias;
