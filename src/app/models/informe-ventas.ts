
export interface VentaProveedor {
  idProveedor: number;
  Proveedor: string;
  NETO: string;
}

export interface InformeVentasResponse {
  presupuesto: string;
  ventas: VentaProveedor[];
}