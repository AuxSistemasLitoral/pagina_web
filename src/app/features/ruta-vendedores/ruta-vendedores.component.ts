import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/auth.service';
import { RutaVendedoresService } from 'src/app/core/ruta-vendedores.service';
@Component({
  selector: 'app-ruta-vendedores',
  templateUrl: './ruta-vendedores.component.html',
  styleUrls: ['./ruta-vendedores.component.css']
})
export class RutaVendedoresComponent implements OnInit {
  usuario: any;
  vendedores: any[] = [];
  loading = true;
  zonaSeleccionada: string = '';
  zonasUnicas: { zona: string, vendedor: string, nombre: string, canal: string, linea: string }[] = [];
  fechaSeleccionada: string = '';
  vendedorSeleccionado: any = null;
  pedidos: any[] = [];
  noPedidos: any[] = [];
  clientesAVisitar: number = 0;
  clientesVisitados: number = 0;


  constructor(
    private rutaService: RutaVendedoresService
  ) { }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('usuario');
    this.usuario = storedUser ? JSON.parse(storedUser) : null;

    console.log('Usuario cargado:', this.usuario);

    if (this.usuario?.cedula) {
      this.rutaService.listSales(this.usuario.cedula).subscribe({
        next: data => {
          console.log('Vendedores recibidos:', data);
          this.vendedores = data;
          this.zonasUnicas = Array.from(
            new Map(
              data.map(v => [v.zona, { zona: v.zona, vendedor: v.vendedor, nombre: v.nombre, canal: v.canal, linea: v.linea }])
            ).values()
          );

          this.loading = false;
        },
        error: err => {
          console.error('Error cargando ruta de vendedores:', err);
          this.loading = false;
        }
      });
    } else {
      console.warn('No se encontró el usuario en localStorage');
      this.loading = false;
    }
  }

  vendedoresFiltrados(): any[] {
    if (!this.zonaSeleccionada) return this.vendedores;
    return this.vendedores.filter(v => v.zona === this.zonaSeleccionada);

  }

  onZonaSeleccionada(zona: string): void {
    this.vendedorSeleccionado = this.vendedores.find(v => v.zona === zona);
    console.log('vendedor selecccionado', this.vendedorSeleccionado?.vendedor);
  }

  onFechaSeleccionada(): void {
    console.log('Fecha seleccionada:', this.fechaSeleccionada);
  }

  getTrackingRoute(): void {
    if (this.vendedorSeleccionado && this.fechaSeleccionada) {
      const payload = {
        vendedor: this.vendedorSeleccionado.vendedor,
        fecha: this.fechaSeleccionada
      };
      console.log('Enviando payload a seguimiento_ruta:', payload);

      this.rutaService.getTracking(payload).subscribe(data => {
        this.pedidos = data.pedido;
        this.noPedidos = data.no_pedido;
        this.clientesAVisitar = data.a_visitar?.ClientesAVisitar;
        this.clientesVisitados = data.visitados?.ClientesVisitados;

        console.log('Pedidos:', this.pedidos);
        console.log('No pedidos:', this.noPedidos);
        console.log('Clientes a visitar:', this.clientesAVisitar);
        console.log('Clientes visitados:', this.clientesVisitados);
      });
    }
  }
  get totalVentas(): number {
  return this.pedidos.reduce((sum, item) => {
    const total = parseFloat(item.Total) || 0; 
    return sum + total;
  }, 0);
}

get horaInicioRuta(): string | null {
  const inicio = this.noPedidos.find(item => item.Detalle === 'INICIO RUTA');
  return inicio ? inicio.hora : null;
}

get horaFinRuta(): string | null {
  const fin = this.noPedidos.find(item => item.Detalle === 'FIN RUTA');
  return fin ? fin.hora : null;
}


}