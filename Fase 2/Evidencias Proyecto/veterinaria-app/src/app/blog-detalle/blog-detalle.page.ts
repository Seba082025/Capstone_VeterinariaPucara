import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api';

@Component({
  selector: 'app-blog-detalle',
  standalone: true,
  templateUrl: './blog-detalle.page.html',
  styleUrls: ['./blog-detalle.page.scss'],
  imports: [IonicModule, CommonModule]
})
export class BlogDetallePage implements OnInit {

  post: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getPostById(id).subscribe({
      next: (res) => {
        this.post = res;
        console.log('📝 Post cargado:', this.post);
      },
      error: (err) => {
        console.error('❌ Error cargando post', err);
      }
    });
  }

  volver() {
    this.router.navigate(['/blog']);
  }
}
