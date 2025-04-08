import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

interface Jugador {
  _id: string;
  nombre: string;
  apellidos: string;
  dorsal: number;
  equipo: string;
}

interface Asistencia {
  _id: string;
  jugador: Jugador;
  fecha: string;
  asistio: boolean;
  motivoAusencia?: string;
  observaciones?: string;
}

interface RegistroAsistencia {
  jugador: string;
  asistio: boolean;
  motivoAusencia?: string;
  observaciones?: string;
}

const Asistencias = () => {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [equipoId, setEquipoId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Cargar jugadores del equipo al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Obtener el usuario actual del localStorage
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          const usuario = JSON.parse(usuarioGuardado);
          
          // Si el usuario tiene un equipo asignado, cargar sus jugadores
          if (usuario.equipo) {
            setEquipoId(usuario.equipo);
            
            // Cargar jugadores del equipo
            const jugadoresResponse = await axios.get(`http://localhost:5000/api/jugadores/equipo/${usuario.equipo}`);
            setJugadores(jugadoresResponse.data);
            
            // Inicializar registros de asistencia
            const registros = jugadoresResponse.data.map((jugador: Jugador) => ({
              jugador: jugador._id,
              asistio: true
            }));
            setRegistrosAsistencia(registros);
            
            // Cargar asistencias existentes para la fecha seleccionada
            cargarAsistenciasPorFecha(fechaSeleccionada);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Cargar asistencias por fecha
  const cargarAsistenciasPorFecha = async (fecha: string) => {
    try {
      setLoading(true);
      
      // Formatear fecha para la consulta
      const fechaFormateada = new Date(fecha).toISOString().split('T')[0];
      
      // Cargar asistencias para la fecha seleccionada
      const asistenciasResponse = await axios.get(`http://localhost:5000/api/asistencias/fecha/${fechaFormateada}`);
      setAsistencias(asistenciasResponse.data);
      
      // Verificar si ya existen registros para esta fecha
      if (asistenciasResponse.data.length > 0) {
        setModoEdicion(true);
        
        // Actualizar registros con los datos existentes
        const registrosExistentes = jugadores.map(jugador => {
          const asistenciaJugador = asistenciasResponse.data.find((a: Asistencia) => 
            a.jugador._id === jugador._id
          );
          
          if (asistenciaJugador) {
            return {
              jugador: jugador._id,
              asistio: asistenciaJugador.asistio,
              motivoAusencia: asistenciaJugador.motivoAusencia,
              observaciones: asistenciaJugador.observaciones
            };
          } else {
            return {
              jugador: jugador._id,
              asistio: true
            };
          }
        });
        
        setRegistrosAsistencia(registrosExistentes);
      } else {
        setModoEdicion(false);
        
        // Reiniciar registros para nueva fecha
        const registrosNuevos = jugadores.map(jugador => ({
          jugador: jugador._id,
          asistio: true
        }));
        setRegistrosAsistencia(registrosNuevos);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar asistencias:', err);
      setError('Error al cargar las asistencias. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  // Manejar cambio de fecha
  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = e.target.value;
    setFechaSeleccionada(nuevaFecha);
    cargarAsistenciasPorFecha(nuevaFecha);
  };

  // Abrir modal para registrar asistencias
  const handleRegistrarAsistencias = () => {
    setShowModal(true);
  };

  // Manejar cambio en asistencia de jugador
  const handleAsistenciaChange = (jugadorId: string, asistio: boolean) => {
    setRegistrosAsistencia(registrosAsistencia.map(registro => 
      registro.jugador === jugadorId ? { ...registro, asistio } : registro
    ));
  };

  // Manejar cambio en motivo de ausencia
  const handleMotivoChange = (jugadorId: string, motivo: string) => {
    setRegistrosAsistencia(registrosAsistencia.map(registro => 
      registro.jugador === jugadorId ? { ...registro, motivoAusencia: motivo } : registro
    ));
  };

  // Guardar registros de asistencia
  const handleGuardarAsistencias = async () => {
    try {
      // Enviar registros al servidor
      await axios.post('http://localhost:5000/api/asistencias/lote', {
        fecha: fechaSeleccionada,
        registros: registrosAsistencia
      });
      
      // Recargar asistencias
      cargarAsistenciasPorFecha(fechaSeleccionada);
      
      // Cerrar modal
      setShowModal(false);
    } catch (err) {
      console.error('Error al guardar asistencias:', err);
      setError('Error al guardar las asistencias. Por favor, intenta de nuevo.');
    }
  };

  if (loading && jugadores.length === 0) {
    return <div className="text-center p-5">Cargando datos...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Control de Asistencias</h2>
        <Button variant="primary" onClick={handleRegistrarAsistencias}>
          Registrar Asistencias
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Fecha</Form.Label>
            <Form.Control
              type="date"
              value={fechaSeleccionada}
              onChange={handleFechaChange}
            />
          </Form.Group>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          <Card.Title>Asistencias {new Date(fechaSeleccionada).toLocaleDateString()}</Card.Title>
          
          {asistencias.length > 0 ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Dorsal</th>
                  <th>Estado</th>
                  <th>Motivo Ausencia</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((asistencia: any) => (
                  <tr key={asistencia._id}>
                    <td>{asistencia.jugador.nombre} {asistencia.jugador.apellidos}</td>
                    <td>{asistencia.jugador.dorsal}</td>
                    <td>
                      {asistencia.asistio ? (
                        <Badge bg="success">Presente</Badge>
                      ) : (
                        <Badge bg="danger">Ausente</Badge>
                      )}
                    </td>
                    <td>{asistencia.motivoAusencia || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-center text-muted">No hay registros de asistencia para esta fecha</p>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal para registrar asistencias */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modoEdicion ? 'Editar Asistencias' : 'Registrar Asistencias'} - {new Date(fechaSeleccionada).toLocaleDateString()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Asistencia</th>
                <th>Motivo Ausencia</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map(jugador => {
                const registro = registrosAsistencia.find(r => r.jugador === jugador._id);
                return (
                  <tr key={jugador._id}>
                    <td>{jugador.nombre} {jugador.apellidos}</td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`asistencia-${jugador._id}`}
                        label={registro?.asistio ? 'Presente' : 'Ausente'}
                        checked={registro?.asistio || false}
                        onChange={(e) => handleAsistenciaChange(jugador._id, e.target.checked)}
                      />
                    </td>
                    <td>
                      {!registro?.asistio && (
                        <Form.Control
                          type="text"
                          placeholder="Motivo de ausencia"
                          value={registro?.motivoAusencia || ''}
                          onChange={(e) => handleMotivoChange(jugador._id, e.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarAsistencias}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Asistencias;
