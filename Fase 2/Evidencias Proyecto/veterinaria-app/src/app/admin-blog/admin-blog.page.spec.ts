import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminBlogPage } from './admin-blog.page';

describe('AdminBlogPage', () => {
  let component: AdminBlogPage;
  let fixture: ComponentFixture<AdminBlogPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBlogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
