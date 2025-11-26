import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProfesionalesPage } from './admin-profesionales.page';

describe('AdminProfesionalesPage', () => {
  let component: AdminProfesionalesPage;
  let fixture: ComponentFixture<AdminProfesionalesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminProfesionalesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
