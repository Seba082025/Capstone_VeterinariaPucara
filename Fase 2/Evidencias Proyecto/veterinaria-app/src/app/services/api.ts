// ✅ api.service.ts (REEMPLAZA TODO)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private BASE_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Servicios
  getServicios(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/servicios`);
  }

  // Clientes + Cita
  crearCliente(cliente: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/clientes`, cliente);
  }

  // Todas las citas
  getCitas(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/citas`);
  }

  // ✅ Horas ocupadas corregido (ruta real del backend)
  getHorasOcupadas(fecha: string, id_servicio: number): Observable<any> {
    return this.http.get(`${this.BASE_URL}/citas/horas-ocupadas?fecha=${fecha}&id_servicio=${id_servicio}`);
  }
}
