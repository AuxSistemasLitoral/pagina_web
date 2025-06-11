import { Component, OnInit } from '@angular/core';
import { InformesVentasService } from 'src/app/core/informes-ventas.service';
import { RutaVendedoresService } from 'src/app/core/ruta-vendedores.service';
import { InformeVentasResponse, VentaProveedor } from 'src/app/models/informe-ventas';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-informes',
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css']
})
export class InformesComponent implements OnInit {
  usuario: any;
  vendedores: any[] = [];
  loading = false;
  zonasUnicas: { zona: string, vendedor: string, nombre: string, canal: string, linea: string }[] = [];
  zonaSeleccionada: string = '';
  yearAvailabe: number[] = [];
  mesesDisponibles: { nombre: string, numero: string }[] = [];
  yearSelected: number | null = null;
  mesSeleccionado: string | null = null;
  datosPresupuestoVentas: any[] = [];
  presupuestoTotal: number | null = null;
  ventasPorProveedor: any[] = [];
  ventasTotales: number | null = null;

  constructor(
    private rutaService: RutaVendedoresService,
    private informesVentasService: InformesVentasService) { }


  ngOnInit(): void {
    const storedUser = localStorage.getItem('usuario');
    this.usuario = storedUser ? JSON.parse(storedUser) : null;
    console.log('Usuario en informes:', this.usuario);
    this.cargarVendedoresYRutas();
    this.inicializarSelectoresFecha();
  }

  private cargarVendedoresYRutas(): void {
    if (this.usuario?.cedula) {
      this.rutaService.listSales(this.usuario.cedula).subscribe({
        next: data => {
          console.log('Vendedores recibidos en informes:', data);
          this.vendedores = data;
          const zonasMap = new Map<string, { zona: string, vendedor: string, nombre: string, canal: string, linea: string }>();
          data.forEach(vendedor => {
            if (!zonasMap.has(vendedor.zona)) {
              zonasMap.set(vendedor.zona, {
                zona: vendedor.zona,
                vendedor: vendedor.vendedor,
                nombre: vendedor.nombre,
                canal: vendedor.canal,
                linea: vendedor.linea
              });
            }
          });
          this.zonasUnicas = Array.from(zonasMap.values());
          this.loading = false;
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            iconColor: '#b71c1c',
            title: 'Error',
            text: 'No se obtuvieron datos de vendedores o rutas.',
            background: '#2c2c2c',
            color: '#ffffff',
            confirmButtonColor: '#b71c1c',
          })
          console.error('Error cargando ruta de vendedores:', err);
          this.loading = false;
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        iconColor: '#b71c1c',
        title: 'Error',
        text: 'No se encontró el usuario, por favor ingresa al sistema',
        background: '#2c2c2c',
        color: '#ffffff',
        confirmButtonColor: '#b71c1c',
      })
      console.warn('No se encontró el usuario, por favor ingresa al sistema');
      this.loading = false;
    }
  }
  private inicializarSelectoresFecha(): void {
    const currentYear = new Date().getFullYear();
    for (let year = 2020; year <= currentYear + 1; year++) {
      this.yearAvailabe.push(year);
    }

    this.mesesDisponibles = [
      { nombre: 'Enero', numero: '01' },
      { nombre: 'Febrero', numero: '02' },
      { nombre: 'Marzo', numero: '03' },
      { nombre: 'Abril', numero: '04' },
      { nombre: 'Mayo', numero: '05' },
      { nombre: 'Junio', numero: '06' },
      { nombre: 'Julio', numero: '07' },
      { nombre: 'Agosto', numero: '08' },
      { nombre: 'Septiembre', numero: '09' },
      { nombre: 'Octubre', numero: '10' },
      { nombre: 'Noviembre', numero: '11' },
      { nombre: 'Diciembre', numero: '12' }
    ];
    this.yearSelected = currentYear;
    this.mesSeleccionado = new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`;
  }


  zonaFiltrada(): any[] {
    if (!this.zonaSeleccionada) return this.vendedores;
    return this.vendedores.filter(v => v.zona === this.zonaSeleccionada);

  }
consultarPresupuestoVentas(): void {
    const periodo = this.obtenerPeriodo();

    if (!this.zonaSeleccionada || !periodo) {
        Swal.fire({
            icon: 'warning',
            iconColor: '#ffc107',
            title: 'Advertencia',
            text: 'Por favor, selecciona una zona, un año y un mes para consultar.',
            background: '#2c2c2c',
            color: '#ffffff',
            confirmButtonColor: '#ffc107',
        });
        return;
    }
    this.loading = true; 
    this.presupuestoTotal = null;
    this.ventasPorProveedor = [];
    this.ventasTotales = null;


    this.informesVentasService.getBugetSales(periodo, this.zonaSeleccionada).subscribe({
      next: (data: InformeVentasResponse) => {
        console.log('Datos de presupuesto de ventas recibidos:', data);
        if (data && data.presupuesto !== undefined && data.presupuesto !== null) {
          const parsedPresupuesto = parseFloat(data.presupuesto);
          this.presupuestoTotal = isNaN(parsedPresupuesto) ? null : parsedPresupuesto;
        } else {
          console.warn('Presupuesto no encontrado o nulo en la respuesta. Se establecerá a null.');
          this.presupuestoTotal = null; 
        }

        if (data && data.ventas && Array.isArray(data.ventas)) {
            this.ventasPorProveedor = data.ventas;
            this.ventasTotales = this.ventasPorProveedor.reduce((sum, item) => sum + parseFloat(item.NETO || '0'), 0);
        } else {
            console.warn('Array de ventas no encontrado o nulo/vacío en la respuesta. Ventas totales se establecerá a 0.');
            this.ventasPorProveedor = [];
            this.ventasTotales = 0;
        }

        this.loading = false; 

      },
      error: err => {
        Swal.fire({
          icon: 'error',
          iconColor: '#b71c1c',
          title: 'Error',
          text: 'No se pudo obtener el presupuesto de ventas. Intenta de nuevo más tarde.',
          background: '#2c2c2c',
          color: '#ffffff',
          confirmButtonColor: '#b71c1c',
        });
        console.error('Error al obtener presupuesto de ventas:', err);
        this.loading = false;
        this.presupuestoTotal = null;
        this.ventasPorProveedor = [];
        this.ventasTotales = null;
      }
    });
  }
  calcularPorcentajeLogro(): number | string {
    if (this.presupuestoTotal === null || this.presupuestoTotal === 0 || this.ventasTotales === null) {
      return '-'; 
    }
    const porcentaje = (this.ventasTotales / this.presupuestoTotal) * 100;
    return isNaN(porcentaje) ? '-' : porcentaje; 
  }

  getPorcentajeLogroNumerico(): number {
    const porcentaje = this.calcularPorcentajeLogro(); 
    if (typeof porcentaje === 'number') {
      return porcentaje;
    }
    return 0; 
  }


  obtenerPeriodo(): string {
    if (this.yearSelected && this.mesSeleccionado) {
      const mesFormateado = this.mesSeleccionado.padStart(2, '0');
      return `${this.yearSelected}${mesFormateado}`;
    }
    return '';
  }


}
