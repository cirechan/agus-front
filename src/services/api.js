
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// === JUGADORES ===
export const getJugadores = () => axios.get(`${API_URL}/jugadores`);
export const getJugadoresPorEquipo = (equipoId) => axios.get(`${API_URL}/jugadores/equipo/${equipoId}`);
export const crearJugador = (data) => axios.post(`${API_URL}/jugadores`, data);
export const actualizarJugador = (id, data) => axios.put(`${API_URL}/jugadores/${id}`, data);
export const eliminarJugador = (id) => axios.delete(`${API_URL}/jugadores/${id}`);

// === EQUIPOS ===
export const getEquipos = () => axios.get(`${API_URL}/equipos`);
export const getEquipo = (id) => axios.get(`${API_URL}/equipos/${id}`);
export const crearEquipo = (data) => axios.post(`${API_URL}/equipos`, data);
export const actualizarEquipo = (id, data) => axios.put(`${API_URL}/equipos/${id}`, data);
export const eliminarEquipo = (id) => axios.delete(`${API_URL}/equipos/${id}`);

// === TEMPORADAS ===
export const getTemporadas = () => axios.get(`${API_URL}/temporadas`);
export const crearTemporada = (data) => axios.post(`${API_URL}/temporadas`, data);
export const actualizarTemporada = (id, data) => axios.put(`${API_URL}/temporadas/${id}`, data);
export const eliminarTemporada = (id) => axios.delete(`${API_URL}/temporadas/${id}`);
export const activarTemporada = (id) => axios.put(`${API_URL}/temporadas/${id}`, { activa: true });

// === ASISTENCIAS ===
export const getAsistenciasPorFecha = (fecha) => axios.get(`${API_URL}/asistencias/fecha/${fecha}`);
export const getAsistenciasPorEquipo = (equipoId) => axios.get(`${API_URL}/asistencias/equipo/${equipoId}`);
export const guardarAsistencias = (data) => axios.post(`${API_URL}/asistencias/lote`, data);

// === USUARIOS ===
export const getUsuarios = () => axios.get(`${API_URL}/usuarios`);
export const loginUsuario = (nombreUsuario) => axios.post(`${API_URL}/usuarios/acceso`, { nombreUsuario });
