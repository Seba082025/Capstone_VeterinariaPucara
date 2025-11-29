import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminServiciosPage } from './admin-servicios.page';

describe('AdminServiciosPage', () => {
  let component: AdminServiciosPage;
  let fixture: ComponentFixture<AdminServiciosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminServiciosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
