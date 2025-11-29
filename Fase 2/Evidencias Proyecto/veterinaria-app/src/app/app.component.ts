import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, HttpClientModule],
})
export class AppComponent {
  constructor() {
    this.verificarSesion();
  }

  verificarSesion() {
    const logged = localStorage.getItem('adminLogged');

    // Si el dato no existe o no es "true", limpiamos para evitar sesiones fantasma
    if (logged !== 'true') {
      localStorage.removeItem('adminLogged');
    }
  }
}
