import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ApiService } from '../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reserva',
  templateUrl: './reserva.page.html',
  styleUrls: ['./reserva.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class ReservaPage implements OnInit {

  servicios: any[] = [];
  profesionales: any[] = [];

  cliente = {
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '',
    email: '',
    nombre_mascota: '',
    raza: '',
    tipo_mascota: ''
  };

  cita = { 
    id_servicio: null as number | null, 
    fecha_hora: '',
    id_profesional: null as number | null
  };

  paso: string = 'servicio';
  today = new Date().toISOString();

  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';

  horasBase: string[] = [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '15:00',
    '15:30', '16:00', '16:30', '17:00'
  ];

  horasDisponibles: string[] = [];

  constructor(private api: ApiService, private alertCtrl: AlertController) {}

  ngOnInit() {
    this.api.getServicios().subscribe({
      next: (res: any) => this.servicios = res,
      error: (err) => console.error('❌ Error al cargar servicios:', err)
    });
  }

  // ===========================================================
  // 1️⃣ Seleccionar servicio
  // ===========================================================
  seleccionarServicio(servicioId: number) {
    this.cita.id_servicio = Number(servicioId);
    this.paso = 'fecha';
  }

  // ===========================================================
  // 2️⃣ Cargar HORAS considerando duración del servicio
  // ===========================================================
  cargarHorasDisponibles() {
    if (!this.fechaSeleccionada || !this.cita.id_servicio) return;

    // 🟦 COMPATIBILIDAD: Oracle devuelve MAYÚSCULAS, Angular minúsculas
    const servicio = this.servicios.find(s =>
      s.id_servicio === this.cita.id_servicio ||
      s.ID_SERVICIO === this.cita.id_servicio
    );
    if (!servicio) return;

    // 🟦 Duración compatible con ambas formas
    const duracion = servicio.duracion_minutos || servicio.DURACION_MINUTOS;

    const fecha = this.fechaSeleccionada.split('T')[0];

    // 🐶 CONSULTA VETERINARIA (30 minutos)
    if (duracion === 30) {
      this.api.getHorasOcupadas(fecha, this.cita.id_servicio).subscribe({
        next: (res: any) => {
          const bloqueadas = res.ocupadas || [];
          this.horasDisponibles = this.horasBase.filter(h => !bloqueadas.includes(h));
        },
        error: () => this.horasDisponibles = [...this.horasBase]
      });
      return;
    }

    // ✂️ PELUQUERÍA (120 minutos → 2 horas)
    if (duracion === 120) {
      const horasPeluqueria = ['09:00', '11:00', '13:00', '15:00'];

      this.api.getHorasOcupadas(fecha, this.cita.id_servicio).subscribe({
        next: (res: any) => {
          const bloqueadas = res.ocupadas || [];
          this.horasDisponibles = horasPeluqueria.filter(h => !bloqueadas.includes(h));
        },
        error: () => this.horasDisponibles = horasPeluqueria
      });
      return;
    }
  }

  continuarFecha() {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      alert('Selecciona una fecha y una hora válida.');
      return;
    }

    const fecha = this.fechaSeleccionada.split('T')[0];
    this.cita.fecha_hora = `${fecha} ${this.horaSeleccionada}`;

    this.cargarProfesionalesDisponibles();
    this.paso = 'profesional';
  }

  // ===========================================================
  // 3️⃣ Profesionales disponibles
  // ===========================================================
  cargarProfesionalesDisponibles() {
    if (!this.cita.id_servicio || !this.cita.fecha_hora) return;

    this.api
      .getProfesionalesDisponibles(this.cita.fecha_hora, this.cita.id_servicio)
      .subscribe({
        next: (res: any) => {
          this.profesionales = res;
        },
        error: (err) => {
          console.error('❌ Error al cargar profesionales disponibles:', err);
        }
      });
  }

  seleccionarProfesional(p: any) {
    this.cita.id_profesional = p.ID_PROFESIONAL;
    this.paso = 'datos';
  }

  // ===========================================================
  // 4️⃣ Confirmar reserva
  // ===========================================================
  async reservar() {
    if (!this.cita.id_servicio || !this.cita.fecha_hora || !this.cita.id_profesional) {
      alert('Debe seleccionar servicio, fecha, hora y profesional.');
      return;
    }

    const data = {
      ...this.cliente,
      id_servicio: this.cita.id_servicio,
      fecha_hora: this.cita.fecha_hora,
      id_profesional: this.cita.id_profesional
    };

    this.api.crearCliente(data).subscribe({
      next: async () => {
        const alert = await this.alertCtrl.create({
          header: '¡Reserva exitosa!',
          message: 'Su cita fue agendada correctamente.',
          buttons: [{ text: 'Aceptar', handler: () => window.location.reload() }]
        });
        await alert.present();
      },
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.error || 'No se pudo agendar la cita.',
          buttons: ['Cerrar']
        });
        await alert.present();
      }
    });
  }
}
