// src/app/blog/blog.page.ts
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss']
})
export class BlogPage implements OnInit {

  posts: any[] = [];

  private meses: string[] = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.api.getPosts().subscribe({
      next: (rows) => {
        this.posts = rows;
        console.log('📄 Posts cargados:', this.posts);
      },
      error: (err) => console.error('❌ Error al cargar posts:', err)
    });
  }

  verPost(id: number) {
    this.router.navigate(['/blog', id]);
  }

  getDia(fecha: string): string {
    if (!fecha) return '';
    return fecha.split('/')[0] || '';
  }

  getMes(fecha: string): string {
    if (!fecha) return '';
    const partes = fecha.split('/');
    const idx = parseInt(partes[1] || '0', 10) - 1;
    return this.meses[idx] || '';
  }

  getExcerpt(html: string): string {
    if (!html) return '';
    // quitar etiquetas HTML para que el resumen sea limpio
    const texto = html.replace(/<[^>]+>/g, '');
    return texto.length > 220 ? texto.slice(0, 220) + '…' : texto;
  }
}
