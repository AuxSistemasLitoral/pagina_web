import { Component, OnInit } from '@angular/core';
import { RutaVendedoresService } from 'src/app/core/ruta-vendedores.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { LatLngTuple } from 'leaflet';
import Swal from 'sweetalert2';

interface CustomMarker extends L.Marker {
  itemData: any;
}

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
  //map: L.Map | null = null;
  map!: L.Map;
  mostrarMapa = false;
  markers: L.Marker[] = [];
  pedidoSeleccionado: any = null;
  noPedidoSeleccionado: any = null;
  //markerClusterGroup: L.MarkerClusterGroup | null = null;
  markerClusterGroup!: L.MarkerClusterGroup;
  detallesSeleccionados: any[] = [];



  constructor(
    private rutaService: RutaVendedoresService
  ) { }


  ngOnInit(): void {
    const storedUser = localStorage.getItem('usuario');
    this.usuario = storedUser ? JSON.parse(storedUser) : null;

    // console.log('Usuario cargado:', this.usuario);

    if (this.usuario?.cedula) {
      this.rutaService.listSales(this.usuario.cedula).subscribe({
        next: data => {
          //console.log('Vendedores recibidos en ruta:', data); 
          this.vendedores = data;
          this.zonasUnicas = Array.from(
            new Map(
              data.map(v => [v.zona, { zona: v.zona, vendedor: v.vendedor, nombre: v.nombre, canal: v.canal, linea: v.linea }])
            ).values()
          );

          this.loading = false;
        },
        error: err => {
          Swal.fire({
            icon: 'error',
            iconColor: '#b71c1c',
            title: 'Error',
            text: 'No se obtuvieron datos',
            background: '#2c2c2c',
            color: '#ffffff',
            confirmButtonColor: '#b71c1c',
          })
         // console.error('Error cargando ruta de vendedores:', err);
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
     // console.warn('No se encontró el usuario en localStorage');
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

      this.rutaService.getTracking(payload).subscribe(data => {
        this.pedidos = data.pedido;
        this.noPedidos = data.no_pedido;
        this.clientesAVisitar = data.a_visitar?.ClientesAVisitar;
        this.clientesVisitados = data.visitados?.ClientesVisitados;
        this.mostrarMapa = true;
        console.log('pedido', this.pedidos)
        console.log(' no pedido', this.noPedidos)
        setTimeout(() => {
          if (this.map) {
            this.map.off();
            this.map.remove();
            this.map = null!;
          }
          this.initMap();
          this.mostrarPuntosEnMapa();
        }, 0);
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

  ngAfterViewInit() {
    this.initMap();
  }

  initMap(): void {
    this.map = L.map('map').setView([8.75161, -75.87585], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div>${count}</div>`,
          className: 'marker-cluster marker-cluster-large',
          iconSize: [40, 40]
        });
      }
    });

    this.markerClusterGroup.on('clusterclick', (a: any) => this.onClusterClick(a));
    this.map.addLayer(this.markerClusterGroup);
  }

  addMarkers(data: any[]): void {
    this.markerClusterGroup.clearLayers();

    data.forEach(item => {
      if (item.latitud && item.longitud) {
        const position = this.jitter(L.latLng(item.latitud, item.longitud));

        const icon = L.icon({
          iconUrl: item.novedad === 'pedido' ? 'assets/marker-pedido.png' : 'assets/marker-no-pedido.png',
          iconSize: [30, 40],
          iconAnchor: [15, 40]
        });

        const marker = L.marker(position, { icon, title: item.clienteNombre || 'Cliente' });

        marker.bindPopup(`
        <strong>${item.clienteNombre}</strong><br/>
        Estado: ${item.novedad}<br/>
        Hora: ${item.hora || 'N/A'}
      `);

        this.markerClusterGroup.addLayer(marker);
      }
    });
  }

  onClusterClick(a: any): void {
    const markers = a.layer.getAllChildMarkers();
    this.detallesSeleccionados = markers.map((m: any) => m.options.itemData);
  }

  jitter(latlng: L.LatLng, offset = 0.0001): L.LatLng {
    return new L.LatLng(
      latlng.lat + (Math.random() - 0.5) * offset,
      latlng.lng + (Math.random() - 0.5) * offset
    );
  }

  getNoPedidoIcon() {
    return L.icon({
      iconUrl: 'assets/icons/no-pedido.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  mostrarPuntosEnMapa(): void {
    if (!this.map) return;

    if (this.markerClusterGroup) {
      this.map.removeLayer(this.markerClusterGroup);
    }

    this.detallesSeleccionados = [];

    this.markerClusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: 18,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count >= 50 ? 'large' : count >= 10 ? 'medium' : 'small';
        return L.divIcon({
          html: `<div title="Grupo de ${count} punto${count > 1 ? 's' : ''}"><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    // ----- PEDIDOS -----
    this.pedidos.forEach(pedido => {
      const marker = L.marker([+pedido.latitud, +pedido.longitud], {
        icon: L.icon({
          iconUrl: 'assets/marker-icon-green.png',
          iconSize: [30, 45],
          iconAnchor: [15, 45],
          popupAnchor: [1, -34],
          shadowUrl: 'assets/marker-shadow.png',
        })
      }) as CustomMarker;

      marker.itemData = { ...pedido, novedad: 'pedido' };

      marker.on('click', () => {
        this.detallesSeleccionados = [{ ...pedido, novedad: 'pedido' }];
      });


      this.markerClusterGroup.addLayer(marker);
    });

    // ----- NO PEDIDOS -----
    this.noPedidos.forEach(noPedido => {
      const marker = L.marker([+noPedido.latitud, +noPedido.longitud], {
        icon: L.icon({
          iconUrl: 'assets/marker-icon-red.png',
          iconSize: [30, 45],
          iconAnchor: [15, 45],
          popupAnchor: [1, -34],
          shadowUrl: 'assets/marker-shadow.png',
        })
      }) as CustomMarker;

      marker.itemData = { ...noPedido, novedad: 'no_pedido' };

      marker.on('click', () => {
        this.detallesSeleccionados = [{ ...noPedido, novedad: 'no_pedido' }];
      });

      this.markerClusterGroup.addLayer(marker);
    });

    // ----- EVENTO PARA CLÚSTERS -----
    this.markerClusterGroup.on('clusterclick', (a: any) => {
      const markers = a.layer.getAllChildMarkers() as CustomMarker[];
      this.detallesSeleccionados = markers.map(m => m.itemData);
    });

    this.map.addLayer(this.markerClusterGroup);

    const allMarkers: LatLngTuple[] = [...this.pedidos, ...this.noPedidos]
      .map(p => [+p.latitud, +p.longitud] as LatLngTuple);

    if (allMarkers.length > 0) {
      const bounds = L.latLngBounds(allMarkers);
      this.map.fitBounds(bounds, { padding: [150, 150] });
    }
  }






}