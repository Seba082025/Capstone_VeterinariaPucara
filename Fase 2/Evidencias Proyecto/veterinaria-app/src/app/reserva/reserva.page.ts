import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ApiService } from '../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reserva',
  templateUrl: './reserva.page.html',
  styleUrls: ['./reserva.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, ReactiveFormsModule, CommonModule]
})
export class ReservaPage implements OnInit {

  servicios: any[] = [];
  profesionales: any[] = [];

  // 🟦 FORMULARIO REACTIVO NUEVO
  formDatos!: FormGroup;

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

  constructor(
    private api: ApiService, 
    private alertCtrl: AlertController,
    private fb: FormBuilder
  ) {}

  ngOnInit() {

    // 🟦 CREAR FORMULARIO REACTIVO
    this.formDatos = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      rut: ['', [Validators.required, this.validarRut]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      nombre_mascota: ['', Validators.required],
      raza: ['', Validators.required],
      tipo_mascota: ['', Validators.required]
    });

    // 🟦 CARGAR SERVICIOS
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
  // 2️⃣ Cargar HORAS según duración
  // ===========================================================
  cargarHorasDisponibles() {
    if (!this.fechaSeleccionada || !this.cita.id_servicio) return;

    const servicio = this.servicios.find(s =>
      s.id_servicio === this.cita.id_servicio ||
      s.ID_SERVICIO === this.cita.id_servicio
    );

    if (!servicio) return;

    const duracion = servicio.duracion_minutos || servicio.DURACION_MINUTOS;
    const fecha = this.fechaSeleccionada.split('T')[0];

    // CONSULTA (30m)
    if (duracion === 30) {
      this.api.getHorasOcupadas(fecha, Number(this.cita.id_servicio)).subscribe({
        next: (res: any) => {
          const bloqueadas = res.ocupadas || [];
          this.horasDisponibles = this.horasBase.filter(h => !bloqueadas.includes(h));
        },
        error: () => this.horasDisponibles = [...this.horasBase]
      });
      return;
    }

    // PELUQUERÍA (120m)
    if (duracion === 120) {
      const horasPeluqueria = ['09:00', '11:00', '13:00', '15:00'];

      this.api.getHorasOcupadas(fecha, Number(this.cita.id_servicio)).subscribe({
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
      .getProfesionalesDisponibles(
        this.cita.fecha_hora, 
        Number(this.cita.id_servicio)
      )
      .subscribe({
        next: (res: any) => this.profesionales = res,
        error: (err) => console.error('❌ Error carga profesionales:', err)
      });
  }

  seleccionarProfesional(p: any) {
    this.cita.id_profesional = p.ID_PROFESIONAL || p.id_profesional;
    this.paso = 'datos';
  }

  // ===========================================================
  // 4️⃣ Confirmar reserva
  // ===========================================================
  async reservar() {

    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }

    const data = {
      ...this.formDatos.value,
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
          message: err?.error?.error || 'No se pudo registrar la reserva.',
          buttons: ['Cerrar']
        });
        await alert.present();
      }
    });
  }

  // ===========================================================
  // 🧪 Validador de RUT chileno
  // ===========================================================
  validarRut(control: any) {
  const rut = (control.value || '').replace(/\./g, '').replace('-', '');

  if (rut.length < 8) return { rutInvalido: true };

  const cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  // 🟦 CALCULO DV ESPERADO (string)
  let dvEsperadoNum = 11 - (suma % 11);
  let dvEsperado =
    dvEsperadoNum === 11 ? '0' :
    dvEsperadoNum === 10 ? 'K' :
    dvEsperadoNum.toString();

  // 🟦 COMPARACIÓN
  return dv === dvEsperado ? null : { rutInvalido: true };
}
}
