// ✅ src/app/admin-blog/admin-blog.page.ts
import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-blog',
  templateUrl: './admin-blog.page.html',
  styleUrls: ['./admin-blog.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AdminBlogPage implements OnInit {

  posts: any[] = [];
  filtrados: any[] = [];
  search = '';

  constructor(
    private api: ApiService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    // 🔒 Requiere estar logueado
    if (!localStorage.getItem('adminLogged')) this.router.navigate(['/admin-login']);
    this.cargar();
  }

  // ===========================
  // 📄 Cargar posts del backend
  // ===========================
  cargar() {
    this.api.getPosts().subscribe({
      next: (rows) => {
        this.posts = rows;
        this.aplicarFiltro();
      },
      error: (e) => console.error('❌ Error cargando posts:', e)
    });
  }

  // ===========================
  // 🔍 Filtro de búsqueda
  // ===========================
  aplicarFiltro() {
    const q = (this.search || '').toLowerCase().trim();
    this.filtrados = !q
      ? this.posts
      : this.posts.filter(p =>
          p.titulo?.toLowerCase().includes(q) ||
          p.contenido?.toLowerCase().includes(q)
        );
  }

  limpiarBusqueda() {
    this.search = '';
    this.aplicarFiltro();
  }

  // ===========================
  // ➕ Crear nuevo post
  // ===========================
  async nuevo() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo artículo',
      inputs: [
        { name: 'titulo', type: 'text', placeholder: 'Título' },
        { name: 'imagen_url', type: 'text', placeholder: 'URL de imagen (opcional)' },
        { name: 'contenido', type: 'textarea', placeholder: 'Contenido / cuerpo del artículo' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.titulo || !data.contenido) return false;
            this.api.createPost({
              titulo: data.titulo,
              contenido: data.contenido,
              imagen_url: data.imagen_url || ''
            }).subscribe({
              next: async () => {
                this.cargar();
                const ok = await this.alertCtrl.create({
                  header: 'Creado',
                  message: 'Artículo publicado correctamente.',
                  buttons: ['OK']
                });
                ok.present();
              },
              error: async (err) => {
                console.error(err);
                const fail = await this.alertCtrl.create({
                  header: 'Error',
                  message: 'No se pudo crear el post.',
                  buttons: ['Cerrar']
                });
                fail.present();
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // ===========================
  // ✏️ Editar post existente
  // ===========================
  async editar(p: any) {
    const alert = await this.alertCtrl.create({
      header: 'Editar artículo',
      inputs: [
        { name: 'titulo', type: 'text', value: p.titulo, placeholder: 'Título' },
        { name: 'imagen_url', type: 'text', value: p.imagen_url, placeholder: 'URL de imagen' },
        { name: 'contenido', type: 'textarea', value: p.contenido?.toString() || '', placeholder: 'Contenido' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            if (!data.titulo || !data.contenido) return false;

            this.api.updatePost(p.id_post, {
              titulo: data.titulo,
              contenido: data.contenido,
              imagen_url: data.imagen_url || ''
            }).subscribe({
              next: async () => {
                this.cargar();
                const ok = await this.alertCtrl.create({
                  header: 'Actualizado',
                  message: 'Artículo modificado correctamente.',
                  buttons: ['OK']
                });
                ok.present();
              },
              error: async (err) => {
                console.error(err);
                const fail = await this.alertCtrl.create({
                  header: 'Error',
                  message: 'No se pudo actualizar el post.',
                  buttons: ['Cerrar']
                });
                fail.present();
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // ===========================
  // 🗑 Eliminar post
  // ===========================
  async eliminar(p: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: '¿Eliminar este artículo? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.api.deletePost(p.id_post).subscribe({
              next: async () => {
                this.cargar();
                const ok = await this.alertCtrl.create({
                  header: 'Eliminado',
                  message: 'Artículo eliminado.',
                  buttons: ['OK']
                });
                ok.present();
              },
              error: async (err) => {
                console.error(err);
                const fail = await this.alertCtrl.create({
                  header: 'Error',
                  message: 'No se pudo eliminar.',
                  buttons: ['Cerrar']
                });
                fail.present();
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // ===========================
  // 🚪 Logout
  // ===========================
  logout() {
    localStorage.removeItem('adminLogged');
    this.router.navigate(['/admin-login']);
  }
}
