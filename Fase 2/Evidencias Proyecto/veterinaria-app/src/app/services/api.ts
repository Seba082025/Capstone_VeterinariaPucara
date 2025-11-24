// api.service.ts (versión corregida y estable)
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
  // 🕒 HORAS OCUPADAS (reserva / admin)
  // ===============================
  getHorasOcupadas(fecha: string, id_servicio: number): Observable<any> {
    return this.http.get(`${this.BASE_URL}/citas/horas-ocupadas`, {
      params: {
        fecha,
        id_servicio: id_servicio?.toString() || '0'
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

  // ✔ Confirmar / cambiar estado (USA /citas/:id)
  actualizarEstado(id: number, estado: string) {
    return this.http.put(`${this.BASE_URL}/citas/${id}`, { estado });
  }

  // ✔ Editar fecha + estado
  actualizarCita(id: number, fecha_hora: string, estado: string) {
    return this.http.put(`${this.BASE_URL}/citas/${id}`, { fecha_hora, estado });
  }

  // ✔ Eliminar
  eliminarCita(id: number) {
    return this.http.delete(`${this.BASE_URL}/citas/${id}`);
  }

  // ===============================
  // 📄 BLOG
  // ===============================
  getPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/blog`);
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

  getPostById(id: number) {
  return this.http.get(`${this.BASE_URL}/blog/${id}`);
}



}
