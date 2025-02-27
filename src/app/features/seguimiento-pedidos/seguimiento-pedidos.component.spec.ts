import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoPedidosComponent } from './seguimiento-pedidos.component';

describe('SeguimientoPedidosComponent', () => {
  let component: SeguimientoPedidosComponent;
  let fixture: ComponentFixture<SeguimientoPedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeguimientoPedidosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeguimientoPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
