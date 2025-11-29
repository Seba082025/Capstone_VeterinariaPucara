import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AdminDashboardPage implements OnInit {

  citas: any[] = [];
  citasFiltradas: any[] = [];

  filtroEstado: string = 'todas';
  filtroFecha: string = '';

  horasBase: string[] = [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '15:00',
    '15:30', '16:00', '16:30', '17:00'
  ];

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCitas();
  }

  // ============================
  // 📅 Cargar todas las citas
  // ============================
  cargarCitas() {
    this.api.getCitas().subscribe({
      next: (res: any) => {

        this.citas = res.map((c: any) => ({
          ID_CITA: c.ID_CITA,
          FECHA_HORA: c.FECHA_HORA,
          ESTADO: c.ESTADO,
          NOMBRE: c.NOMBRE,
          APELLIDO: c.APELLIDO,
          RUT: c.RUT,
          TELEFONO: c.TELEFONO,   // 👈 AGREGADO
          NOMBRE_MASCOTA: c.NOMBRE_MASCOTA,
          NOMBRE_SERVICIO: c.NOMBRE_SERVICIO,
          ID_SERVICIO: c.ID_SERVICIO || 1,
          NOMBRE_PROFESIONAL: c.NOMBRE_PROFESIONAL,
          APELLIDO_PROFESIONAL: c.APELLIDO_PROFESIONAL
        }));

        this.filtrarCitas();
      },
      error: (err) => console.error('❌ Error al cargar citas:', err)
    });
  }

  // ============================
  // 🔍 Filtrar por estado / fecha
  // ============================
  filtrarCitas() {
    this.citasFiltradas = this.citas.filter(c => {
      const coincideEstado =
        this.filtroEstado === 'todas' || c.ESTADO === this.filtroEstado;

      const coincideFecha =
        !this.filtroFecha || c.FECHA_HORA.startsWith(this.filtroFecha);

      return coincideEstado && coincideFecha;
    });
  }

  onFiltroChange() {
    this.filtrarCitas();
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'danger';
      default: return 'medium';
    }
  }

  // ============================
  // ✏️ Editar cita
  // ============================
  async editarCita(cita: any) {
    const fechaInicial = cita.FECHA_HORA.split('T')[0];
    const id_servicio = cita.ID_SERVICIO;

    const alertFecha = await this.alertCtrl.create({
      header: 'Editar fecha de la cita',
      inputs: [{ name: 'fecha', type: 'date', value: fechaInicial }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (data) => {
            const fechaSeleccionada = data.fecha;
            if (!fechaSeleccionada) return;

            this.api.getHorasOcupadas(fechaSeleccionada, id_servicio).subscribe({
              next: async (res: any) => {
                const horasOcupadas: string[] = res.ocupadas || [];
                const horasDisponibles = this.horasBase.filter(h => !horasOcupadas.includes(h));

                if (horasDisponibles.length === 0) {
                  const alerta = await this.alertCtrl.create({
                    header: 'Sin disponibilidad',
                    message: 'No hay horas libres para esta fecha.',
                    buttons: ['Aceptar']
                  });
                  await alerta.present();
                  return;
                }

                const alertHora = await this.alertCtrl.create({
                  header: 'Selecciona hora',
                  inputs: horasDisponibles.map(h => ({
                    name: 'hora',
                    type: 'radio',
                    label: h,
                    value: h
                  })),
                  buttons: [
                    { text: 'Cancelar', role: 'cancel' },
                    {
                      text: 'Guardar',
                      handler: (dataHora) => {
                        const nuevaFecha = `${fechaSeleccionada}T${dataHora}:00`;
                        this.actualizarCita(cita.ID_CITA, nuevaFecha, cita.ESTADO);
                      }
                    }
                  ]
                });
                await alertHora.present();
              }
            });
          }
        }
      ]
    });
    await alertFecha.present();
  }

  // ============================
  // 🔄 Actualizar cita
  // ============================
  actualizarCita(id: number, nuevaFecha: string, estado: string) {
    this.api.actualizarCita(id, nuevaFecha, estado).subscribe({
      next: async () => {
        this.cargarCitas();
        const ok = await this.alertCtrl.create({
          header: 'Actualizado',
          message: 'Cita modificada correctamente.',
          buttons: ['Aceptar']
        });
        await ok.present();
      },
      error: async (err) => {
        console.error('❌ Error al actualizar cita:', err);
        const fail = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo actualizar la cita.',
          buttons: ['Aceptar']
        });
        await fail.present();
      }
    });
  }

  actualizarEstado(id: number, estado: string) {
    this.api.actualizarEstado(id, estado).subscribe({
      next: () => this.cargarCitas(),
      error: (err) => console.error('❌ Error al actualizar estado:', err)
    });
  }

  eliminarCita(id: number) {
    this.api.eliminarCita(id).subscribe({
      next: () => this.cargarCitas(),
      error: (err) => console.error('❌ Error al eliminar cita:', err)
    });
  }

logout() {
  localStorage.removeItem('adminLogged');
  localStorage.removeItem('adminUser');
  this.router.navigate(['/admin-login']);
}
}
