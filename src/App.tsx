import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Importar páginas
import Dashboard from './pages/Dashboard';
import Jugadores from './pages/Jugadores';
import Asistencias from './pages/Asistencias';
import Equipos from './pages/Equipos';
import Temporadas from './pages/Temporadas';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Club San Agustín</h3>
          </div>
          <ul className="sidebar-menu">
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/jugadores">Jugadores</Link>
            </li>
            <li>
              <Link to="/asistencias">Asistencias</Link>
            </li>
            <li>
              <Link to="/equipos">Equipos</Link>
            </li>
            <li>
              <Link to="/temporadas">Temporadas</Link>
            </li>
          </ul>
        </div>
        <div className="main-content">
          <div className="header">
            <h2>Club de Fútbol San Agustín</h2>
            <div>
              <Link to="/login" className="btn btn-secondary">Acceder</Link>
            </div>
          </div>
          <Container fluid>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jugadores" element={<Jugadores />} />
              <Route path="/asistencias" element={<Asistencias />} />
              <Route path="/equipos" element={<Equipos />} />
              <Route path="/temporadas" element={<Temporadas />} />
            </Routes>
          </Container>
        </div>
      </div>
    </Router>
  );
}

export default App;
