import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { CarteraService } from 'src/app/core/cartera.service';
import { SharedDataService } from 'src/app/core/shared-data.service';

@Component({
  selector: 'app-cartera',
  templateUrl: './cartera.component.html',
  styleUrls: ['./cartera.component.css']
})
export class CarteraComponent implements OnInit {
  cartera: any[] = [];
  loading = true;
  private subscription!: Subscription;
  totalAdeudado: number = 0;
  selectedFacturas: any[] = [];
  sobreCupo: number = 0;
  isMobile: boolean = false;
  isRedirecting: boolean = false;

  constructor(
    private carteraService: CarteraService,
    private sharedDataService: SharedDataService
  ) { }

  ngOnInit(): void {
    this.subscription = this.sharedDataService.sucursalChanged$.subscribe((sucursalData) => {
      if (sucursalData?.id_cliente) {
        this.fetchCartera(sucursalData.id_cliente);
      }
    });
    const idClienteStr = localStorage.getItem('id_cliente');
    const idCliente = idClienteStr ? Number(idClienteStr) : null;
    if (idCliente) {
      this.fetchCartera(idCliente);
    } else {
      this.loading = false;
    }

    this.checkScreenSize();
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
  }

  fetchCartera(idCliente: number): void {
    this.loading = true;
    this.carteraService.getCarteraPendiente(idCliente).subscribe({
      next: (data) => {
        this.cartera = data;
        this.loading = false;

        this.totalAdeudado = this.cartera.reduce((sum, item) => {
          return sum + Number(item.saldo);
        }, 0);

        this.sobreCupo = this.totalAdeudado - this.cartera[0].cupo
      },

      error: (err) => {
        console.error('Error al obtener cartera pendiente:', err);
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get totalAPagar(): number {
    return this.selectedFacturas.reduce((total, factura) => {
      const valor = parseFloat(factura.saldoAEditar || factura.saldo);
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
  }


  toggleFactura(item: any) {
    const index = this.selectedFacturas.indexOf(item);

    if (index > -1) {
      this.selectedFacturas.splice(index, 1);
    } else {
      item.saldoAEditar = item.saldo;
      this.selectedFacturas.push(item);
    }
  }

//   async generarPago(): Promise<void> {
//   if (this.selectedFacturas.length === 0) {
//     alert('Debes seleccionar al menos una factura');
//     return;
//   }

//   const cliente = localStorage.getItem('id_cliente');
//   if (!cliente) {
//     alert('Cliente no definido');
//     return;
//   }

//   const payload = {
//     cliente: cliente,
//     facturas: this.selectedFacturas.map(f => {
//       const [tipo, num] = f.factura.split('-');
//       return {
//         Factura: `${tipo}-${num}`,
//         pagoparcial: parseFloat(f.saldoAEditar || f.saldo)
//       };
//     })
//   };

//   console.log('Payload enviado a TransacPagoCartera:', payload);

//   try {
//     // Paso 1: registrar transacción
//     const resp1: any = await this.carteraService.registrarPagoCartera(payload).toPromise();

//     if (!resp1 || !resp1.pagoid || !resp1.idcarterapago) {
//       console.error('No se pudo registrar la transacción:', resp1);
//       alert('Ocurrió un error al registrar el pago');
//       return;
//     }

//     const pagoid = resp1.pagoid;
//     const idcarterapago = resp1.idcarterapago;
//     const total = this.totalAPagar;

//     // Paso 2: generar enlace de pasarela
//     const resp2: any = await this.carteraService.generarLinkPasarela(pagoid, total).toPromise();
//     console.log('Respuesta cruda de generarLinkPasarela:', resp2);

//     let parsed;
//     try {
//       parsed = JSON.parse(resp2);
//       console.log('Respuesta parseada:', parsed);
//     } catch (e) {
//       console.error('Error al parsear JSON:', e);
//       alert('La respuesta del servidor no es JSON válido');
//       return;
//     }

//     if (!parsed.formUrl || !parsed.orderId) {
//       console.error('No se recibió formUrl o orderId:', parsed);
//       alert(parsed.errorMessage || 'Error al generar el enlace de pago');
//       return;
//     }

//     // Paso 3: actualizar la tabla con orderId y estado
//     await this.carteraService.updateCarteraPago(idcarterapago, parsed.orderId).toPromise();

//     // Paso 4: redirigir al formulario de pago
//     this.isRedirecting = true;
//     window.location.href = parsed.formUrl;

//   } catch (err) {
//     console.error('Error durante el proceso de pago:', err);
//     alert('Error inesperado');
//   }
// }


  async generarPago(): Promise<void> {
    if (this.selectedFacturas.length === 0) {
      alert('Debes seleccionar al menos una factura');
      return;
    }

    const cliente = localStorage.getItem('id_cliente');
    if (!cliente) {
      alert('Cliente no definido');
      return;
    }

    const payload = {
      cliente: cliente,
      facturas: this.selectedFacturas.map(f => {
        const [tipo, num] = f.factura.split('-');
        return {
          Factura: `${tipo}-${num}`,
          pagoparcial: parseFloat(f.saldoAEditar || f.saldo)
        };
      })
    };

    console.log('Payload enviado a TransacPagoCartera:', payload);

    try {
      // Paso 1: registrar transacción
      const resp1: any = await this.carteraService.registrarPagoCartera(payload).toPromise();

      if (!resp1 || !resp1.pagoid) {
        console.error('No se pudo registrar la transacción:', resp1);
        alert('Ocurrió un error al registrar el pago');
        return;
      }

      const pagoid = resp1.pagoid;
      const total = this.totalAPagar;

      // Paso 2: generar enlace
      const resp2: any = await this.carteraService.generarLinkPasarela(pagoid, total).toPromise();
      console.log('Respuesta cruda de generarLinkPasarela:', resp2);

      let parsed;
      try {
        parsed = JSON.parse(resp2);
        console.log('Respuesta parseada:', parsed);
      } catch (e) {
        console.error('Error al parsear JSON:', e);
        alert('La respuesta del servidor no es JSON válido');
        return;
      }

      if (!parsed.formUrl) {
        console.error('No se recibió formUrl:', parsed);
        alert(parsed.errorMessage || 'Error al generar el enlace de pago');
        return;
      }

    await this.carteraService.updateCarteraPago(resp1.pagoid, parsed.orderId).toPromise();
     alert('echo');
      this.isRedirecting = true;
      window.location.href = parsed.formUrl;

    } catch (err) {
      console.error('Error durante el proceso de pago:', err);
      alert('Error inesperado');
    }
  }





}
