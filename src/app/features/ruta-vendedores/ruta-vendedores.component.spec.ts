import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutaVendedoresComponent } from './ruta-vendedores.component';

describe('RutaVendedoresComponent', () => {
  let component: RutaVendedoresComponent;
  let fixture: ComponentFixture<RutaVendedoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RutaVendedoresComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RutaVendedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
