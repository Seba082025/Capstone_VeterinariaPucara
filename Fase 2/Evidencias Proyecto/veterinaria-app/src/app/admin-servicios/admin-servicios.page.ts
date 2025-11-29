import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { Router, RouterLink  } from '@angular/router';

@Component({
  selector: 'app-admin-servicios',
  templateUrl: './admin-servicios.page.html',
  styleUrls: ['./admin-servicios.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule,RouterLink]
})
export class AdminServiciosPage implements OnInit {

  servicios: any[] = [];

  mostrarFormulario = false;   // 👈 Necesario para mostrar/ocultar
  modoEditar = false;          // 👈 Si está editando o creando

  // FORMULARIO
  form = {
    id_servicio: null as number | null,
    nombre_servicio: '',
    descripcion: '',
    precio: null as number | null,
    duracion_minutos: null as number | null
  };

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarServicios();
  }

  logout() {
    localStorage.removeItem("adminLogged");
    this.router.navigate(['/admin-login']);
  }

  // =====================================
  // MOSTRAR / OCULTAR FORMULARIO
  // =====================================
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  // =====================================
  // CARGAR SERVICIOS
  // =====================================
  cargarServicios() {
    this.api.getServicios().subscribe({
      next: (res: any) => this.servicios = res,
      error: (err) => console.error("❌ Error al cargar servicios:", err)
    });
  }

  // =====================================
  // FORMULARIO: NUEVO
  // =====================================
  resetFormulario() {
    this.modoEditar = false;
    this.form = {
      id_servicio: null,
      nombre_servicio: '',
      descripcion: '',
      precio: null,
      duracion_minutos: null
    };
  }

  // =====================================
  // CREAR SERVICIO
  // =====================================
  crear() {
    this.api.crearServicio(this.form).subscribe({
      next: async () => {
        const alert = await this.alertCtrl.create({
          header: "Servicio creado",
          message: "El servicio fue agregado exitosamente.",
          buttons: ["OK"]
        });
        await alert.present();

        this.cargarServicios();
        this.resetFormulario();
        this.mostrarFormulario = false;
      },
      error: async () => {
        const alert = await this.alertCtrl.create({
          header: "Error",
          message: "No se pudo crear el servicio.",
          buttons: ["OK"]
        });
        await alert.present();
      }
    });
  }

  // =====================================
  // EDITAR SERVICIO (CARGAR FORMULARIO)
  // =====================================
  cargarEdicion(s: any) {
    this.modoEditar = true;
    this.mostrarFormulario = true;

    this.form = {
      id_servicio: s.ID_SERVICIO,
      nombre_servicio: s.NOMBRE_SERVICIO,
      descripcion: s.DESCRIPCION,
      precio: s.PRECIO,
      duracion_minutos: s.DURACION_MINUTOS
    };
  }

  // =====================================
  // GUARDAR EDICIÓN
  // =====================================
  guardarEdicion() {
    this.api.editarServicio(this.form.id_servicio!, this.form).subscribe({
      next: async () => {
        const alert = await this.alertCtrl.create({
          header: "Servicio actualizado",
          message: "Los datos fueron modificados.",
          buttons: ["OK"]
        });
        await alert.present();

        this.cargarServicios();
        this.resetFormulario();
        this.mostrarFormulario = false;
      },
      error: async () => {
        const alert = await this.alertCtrl.create({
          header: "Error",
          message: "No se pudo actualizar.",
          buttons: ["OK"]
        });
        await alert.present();
      }
    });
  }

  // =====================================
  // ELIMINAR SERVICIO
  // =====================================
  async eliminar(s: any) {
    const alert = await this.alertCtrl.create({
      header: "¿Eliminar servicio?",
      message: "Esta acción no se puede deshacer.",
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          handler: () => {
            this.api.eliminarServicio(s.ID_SERVICIO).subscribe({
              next: async () => {
                const okAlert = await this.alertCtrl.create({
                  header: "Eliminado",
                  message: "Servicio eliminado correctamente.",
                  buttons: ["OK"]
                });
                await okAlert.present();

                this.cargarServicios();
              },
              error: async (err) => {
                const errAlert = await this.alertCtrl.create({
                  header: "Error",
                  message: err.error?.error || "No se pudo eliminar.",
                  buttons: ["OK"]
                });
                await errAlert.present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  

}
