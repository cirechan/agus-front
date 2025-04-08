import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

interface Usuario {
  _id: string;
  nombreUsuario: string;
  rol: string;
  equipo: {
    _id: string;
    nombre: string;
    categoria: string;
  };
}

interface Equipo {
  _id: string;
  nombre: string;
  categoria: string;
  limiteJugadores: number;
}

interface Jugador {
  _id: string;
  nombre: string;
  apellidos: string;
  posicion: string;
}

interface EstadisticasDashboard {
  totalJugadores: number;
  asistenciaPromedio: number;
  jugadoresDestacados: Jugador[];
  proximosEventos: string[];
}

const Dashboard = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasDashboard>({
    totalJugadores: 0,
    asistenciaPromedio: 0,
    jugadoresDestacados: [],
    proximosEventos: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar información del usuario desde localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuarioParsed = JSON.parse(usuarioGuardado);
      setUsuario(usuarioParsed);
      
      // Si el usuario tiene un equipo asignado, cargar datos del equipo
      if (usuarioParsed.equipo) {
        cargarDatosEquipo(usuarioParsed.equipo);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError('No hay usuario logueado');
    }
  }, []);

  const cargarDatosEquipo = async (equipoId: string) => {
    try {
      // Cargar información del equipo
      const equipoResponse = await axios.get(`http://localhost:5000/api/equipos/${equipoId}`);
      setEquipo(equipoResponse.data);
      
      // Cargar jugadores del equipo
      const jugadoresResponse = await axios.get(`http://localhost:5000/api/jugadores/equipo/${equipoId}`);
      
      // Cargar asistencias del equipo
      const asistenciasResponse = await axios.get(`http://localhost:5000/api/asistencias/equipo/${equipoId}`);
      
      // Calcular estadísticas
      const totalJugadores = jugadoresResponse.data.length;
      
      // Calcular asistencia promedio (simplificado para el MVP)
      let asistenciaPromedio = 0;
      if (asistenciasResponse.data.length > 0) {
        const asistencias = asistenciasResponse.data.filter((a: any) => a.asistio).length;
        asistenciaPromedio = Math.round((asistencias / asistenciasResponse.data.length) * 100);
      }
      
      // Jugadores destacados (simplificado para el MVP)
      const jugadoresDestacados = jugadoresResponse.data.slice(0, 3).map((j: any) => ({
        _id: j._id,
        nombre: j.nombre,
        apellidos: j.apellidos,
        posicion: j.posicion
      }));
      
      // Eventos próximos (datos de ejemplo para el MVP)
      const proximosEventos = [
        'Entrenamiento - Martes 18:00',
        'Partido vs. CD Ebro - Sábado 10:00',
        'Reunión técnica - Jueves 19:30'
      ];
      
      setEstadisticas({
        totalJugadores,
        asistenciaPromedio,
        jugadoresDestacados,
        proximosEventos
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos del equipo:', err);
      setError('Error al cargar datos del equipo');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-5">Cargando...</div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      
      {usuario && (
        <Alert variant="info">
          Bienvenido, <strong>{usuario.nombreUsuario}</strong> ({usuario.rol})
          {equipo && <span> - Equipo: <strong>{equipo.nombre}</strong> ({equipo.categoria})</span>}
        </Alert>
      )}
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Jugadores</h3>
          <div className="stat-value">{estadisticas.totalJugadores}</div>
        </div>
        
        <div className="stat-card">
          <h3>Asistencia Promedio</h3>
          <div className="stat-value">{estadisticas.asistenciaPromedio}%</div>
        </div>
        
        <div className="stat-card">
          <h3>Temporada</h3>
          <div className="stat-value">2024-2025</div>
        </div>
      </div>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Jugadores Destacados</Card.Title>
              {estadisticas.jugadoresDestacados.length > 0 ? (
                <ul className="list-group">
                  {estadisticas.jugadoresDestacados.map(jugador => (
                    <li key={jugador._id} className="list-group-item">
                      {jugador.nombre} {jugador.apellidos} - {jugador.posicion}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No hay jugadores destacados</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Próximos Eventos</Card.Title>
              {estadisticas.proximosEventos.length > 0 ? (
                <ul className="list-group">
                  {estadisticas.proximosEventos.map((evento, index) => (
                    <li key={index} className="list-group-item">
                      {evento}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No hay eventos próximos</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
