import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { Router, ActivatedRoute } from '@angular/router';

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
  returnUrl: string = '/admin-dashboard';

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Lee returnUrl si viene desde el guard
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/admin-dashboard';
  }

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
        console.log('✅ Login correcto:', res);

        // Marca sesión de admin
        localStorage.setItem('adminLogged', 'true');
        localStorage.setItem('adminUser', res?.usuario ?? this.usuario);

        const alert = await this.alertCtrl.create({
          header: 'Bienvenido',
          message: `Acceso correcto, ${res?.usuario ?? this.usuario}`,
          buttons: [{
            text: 'Continuar',
            handler: () => this.router.navigate([this.returnUrl])
          }]
        });
        await alert.present();
      },

      error: async () => {
        // Limpia posibles restos de sesión mala
        localStorage.removeItem('adminLogged');
        localStorage.removeItem('adminUser');

        const alert = await this.alertCtrl.create({
          header: 'Acceso denegado',
          message: 'Usuario o contraseña incorrectos.',
          buttons: ['Intentar de nuevo']
        });
        await alert.present();
      }
    });
  }
}
