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

  cita = { id_servicio: null as number | null, fecha_hora: '' };

  paso: string = 'servicio';
  profesional: string = '';
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
      next: (res: any) => {
        this.servicios = res;
        console.log('📋 Servicios cargados:', this.servicios);
      },
      error: (err) => console.error('❌ Error al cargar servicios:', err)
    });
  }

  // ===============================
  // 1️⃣ Seleccionar servicio
  // ===============================
  seleccionarServicio(servicioId: number) {
    this.cita.id_servicio = Number(servicioId);
    console.log('✅ Servicio seleccionado:', this.cita.id_servicio);
    this.paso = 'fecha';
  }

  // ===============================
  // 2️⃣ Cargar horas disponibles
  // ===============================
  cargarHorasDisponibles() {
    if (!this.fechaSeleccionada || !this.cita.id_servicio) return;

    const fecha = this.fechaSeleccionada.split('T')[0];
    const id_servicio = Number(this.cita.id_servicio); // Aseguramos número

    console.log(`📤 Buscando horas ocupadas para servicio ${id_servicio} en fecha ${fecha}`);

    this.api.getHorasOcupadas(fecha, id_servicio).subscribe({
      next: (res: any) => {
        const horasOcupadas: string[] = res?.ocupadas || [];
        this.horasDisponibles = this.horasBase.filter(h => !horasOcupadas.includes(h));

        console.log('⛔ Ocupadas:', horasOcupadas);
        console.log('✅ Disponibles:', this.horasDisponibles);
      },
      error: (err) => {
        console.error('❌ Error al consultar horas ocupadas:', err);
        this.horasDisponibles = [...this.horasBase];
      }
    });
  }

  // ===============================
  // 3️⃣ Continuar a paso siguiente
  // ===============================
  continuarFecha() {
    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      alert('Selecciona una fecha y una hora válida.');
      return;
    }

    const fecha = this.fechaSeleccionada.split('T')[0];
    this.cita.fecha_hora = `${fecha}T${this.horaSeleccionada}:00`;
    this.paso = 'profesional';

    console.log('🕒 Fecha final enviada:', this.cita.fecha_hora);
  }

  // ===============================
  // 4️⃣ Seleccionar profesional
  // ===============================
  seleccionarProfesional(nombre: string) {
    this.profesional = nombre;
    this.paso = 'datos';
  }

  // ===============================
  // 5️⃣ Confirmar reserva
  // ===============================
  async reservar() {
    if (!this.cita.id_servicio || !this.cita.fecha_hora) {
      alert('Debes seleccionar servicio, fecha y hora antes de continuar.');
      return;
    }

    const data = {
      ...this.cliente,
      id_servicio: this.cita.id_servicio,
      fecha_hora: this.cita.fecha_hora,
      profesional: this.profesional
    };

    console.log('📤 Enviando datos al backend:', data);

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
