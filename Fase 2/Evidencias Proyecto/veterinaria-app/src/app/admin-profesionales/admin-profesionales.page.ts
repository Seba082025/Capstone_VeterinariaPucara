// src/app/admin-profesionales/admin-profesionales.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ApiService } from '../services/api';
import { Router, RouterModule } from '@angular/router';   // ✅ IMPORTANTE

@Component({
  selector: 'app-admin-profesionales',
  standalone: true,
  templateUrl: './admin-profesionales.page.html',
  styleUrls: ['./admin-profesionales.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule      // ✅ NECESARIO PARA routerLink
  ]
})
export class AdminProfesionalesPage implements OnInit {

  profesionales: any[] = [];
  servicios: any[] = [];

  mostrarFormulario = false;
  modoEditar = false;
  profesionalEdicion: any = null;

  formulario = {
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    id_servicio: null,
    activo: 'S'
  };

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  // 🔹 Alternar formulario
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  // 🔹 Cargar lista de profesionales y servicios
  cargarDatos() {
    this.api.getProfesionales().subscribe(p => this.profesionales = p);
    this.api.getServicios().subscribe(s => this.servicios = s);
  }

  // 🔹 Crear profesional
  crear() {
    this.api.crearProfesional(this.formulario).subscribe(async () => {
      const alert = await this.alertCtrl.create({
        header: 'Profesional creado',
        message: 'El profesional fue agregado correctamente.',
        buttons: ['OK']
      });
      await alert.present();

      this.resetFormulario();
      this.cargarDatos();
      this.mostrarFormulario = false;
    });
  }

  // 🔹 Cargar profesional en el formulario
  cargarEdicion(p: any) {
    this.modoEditar = true;
    this.mostrarFormulario = true;

    this.profesionalEdicion = p;

    this.formulario = {
      nombre: p.NOMBRE,
      apellido: p.APELLIDO,
      telefono: p.TELEFONO,
      email: p.EMAIL,
      id_servicio: p.ID_SERVICIO,
      activo: p.ACTIVO
    };
  }

  // 🔹 Guardar cambios de edición
  guardarEdicion() {
    this.api.actualizarProfesional(this.profesionalEdicion.ID_PROFESIONAL, this.formulario)
      .subscribe(async () => {
        const alert = await this.alertCtrl.create({
          header: 'Actualizado',
          message: 'El profesional fue actualizado correctamente.',
          buttons: ['OK']
        });

        await alert.present();

        this.resetFormulario();
        this.cargarDatos();
        this.mostrarFormulario = false;
      });
  }

  // 🔹 Eliminar profesional
  async eliminar(p: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar profesional',
      message: `¿Deseas eliminar a ${p.NOMBRE} ${p.APELLIDO}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.api.eliminarProfesional(p.ID_PROFESIONAL).subscribe(() => {
              this.cargarDatos();
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // 🔹 Resetear formulario
  resetFormulario() {
    this.modoEditar = false;
    this.profesionalEdicion = null;
    this.formulario = {
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      id_servicio: null,
      activo: 'S'
    };
  }

  // 🔹 Cerrar sesión
  logout() {
    localStorage.removeItem('adminLogged');
    this.router.navigate(['/admin-login']);
  }
}
