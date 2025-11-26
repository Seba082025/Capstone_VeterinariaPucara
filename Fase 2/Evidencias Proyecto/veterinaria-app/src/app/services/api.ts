// api.service.ts — versión FINAL corregida
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private BASE_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // ===============================
  // 🐾 SERVICIOS
  // ===============================
  getServicios(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/servicios`);
  }

  // ===============================
  // 👤 CLIENTES + CITAS
  // ===============================
  crearCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/clientes`, cliente);
  }

  getCitas(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/citas`);
  }

  // ===============================
  // 🕒 HORAS OCUPADAS (correcto y optimizado)
  // ===============================
  getHorasOcupadas(fecha: string, id_servicio: number): Observable<any> {

    return this.http.get(`${this.BASE_URL}/citas/horas-ocupadas`, {
      params: {
        fecha: fecha,
        id_servicio: id_servicio.toString()
      }
    });
  }

  // ===============================
  // 🔐 LOGIN ADMINISTRADOR
  // ===============================
  loginAdmin(usuario: string, password: string) {
    return this.http.post(`${this.BASE_URL}/api/admin/login`, { usuario, password });
  }

  // ===============================
  // ⚙️ GESTIÓN DE CITAS (Admin)
  // ===============================
  actualizarEstado(id: number, estado: string) {
    return this.http.put(`${this.BASE_URL}/citas/${id}`, { estado });
  }

  actualizarCita(id: number, fecha_hora: string, estado: string) {
    return this.http.put(`${this.BASE_URL}/citas/${id}`, { fecha_hora, estado });
  }

  eliminarCita(id: number) {
    return this.http.delete(`${this.BASE_URL}/citas/${id}`);
  }

  // ===============================
  // 📄 BLOG
  // ===============================
  getPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/blog`);
  }

  getPostById(id: number) {
    return this.http.get(`${this.BASE_URL}/blog/${id}`);
  }

  createPost(data: { titulo: string; contenido: string; imagen_url?: string }) {
    return this.http.post(`${this.BASE_URL}/blog`, data);
  }

  updatePost(id: number, data: { titulo: string; contenido: string; imagen_url?: string }) {
    return this.http.put(`${this.BASE_URL}/blog/${id}`, data);
  }

  deletePost(id: number) {
    return this.http.delete(`${this.BASE_URL}/blog/${id}`);
  }

  // ======================================================
  // 👨‍⚕️ PROFESIONALES
  // ======================================================

  // Obtener todos los profesionales
  getProfesionales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/profesionales`);
  }

  // Profesionales disponibles para la reserva
  getProfesionalesDisponibles(fecha_hora: string, id_servicio: number) {

    return this.http.get<any[]>(
      `${this.BASE_URL}/profesionales/disponibles`,
      { params: { fecha_hora, id_servicio: id_servicio.toString() } }
    );
  }

  // Profesionales por servicio
  getProfesionalesPorServicio(id_servicio: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/profesionales/servicio/${id_servicio}`);
  }

  // Crear profesional
  crearProfesional(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/profesionales`, data);
  }

  // Actualizar profesional
  actualizarProfesional(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/profesionales/${id}`, data);
  }

  // Eliminar profesional
  eliminarProfesional(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/profesionales/${id}`);
  }

}
