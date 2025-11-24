import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.page.html',
  styleUrls: ['./admin-login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class AdminLoginPage implements OnInit {

  usuario: string = '';
  password: string = '';

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {}

  // ✅ Método login del administrador
  async login() {
    if (!this.usuario || !this.password) {
      const alert = await this.alertCtrl.create({
        header: 'Campos incompletos',
        message: 'Por favor ingresa usuario y contraseña.',
        buttons: ['Aceptar']
      });
      await alert.present();
      return;
    }

    this.api.loginAdmin(this.usuario, this.password).subscribe({
      next: async (res: any) => {
        console.log('✅ Acceso permitido:', res);
        localStorage.setItem('admin', res.usuario);

        const alert = await this.alertCtrl.create({
          header: 'Bienvenido',
          message: `Acceso correcto, ${res.usuario}`,
          buttons: [{
            text: 'Continuar',
            handler: () => this.router.navigate(['/admin-dashboard'])
          }]
        });
        await alert.present();
      },
      error: async (err) => {
        console.error('❌ Error en login:', err);
        const alert = await this.alertCtrl.create({
          header: 'Acceso denegado',
          message: err?.error?.error || 'Usuario o contraseña incorrectos.',
          buttons: ['Intentar de nuevo']
        });
        await alert.present();
      }
    });
  }
}
