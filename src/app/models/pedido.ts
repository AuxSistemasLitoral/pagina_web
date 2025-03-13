export interface Pedido {
    EncabezadoPedido: {
      id_app: number;
      Vendedor_cedula: string;
      Fecha: string;
      cliente_nit: string;
      cliente_sucursal: string;
      observaciones: string;
      Latitud: string;
      Longitud: string;
    };
    DetallePedido: DetallePedido[];
  }
  
  export interface DetallePedido {
    product_id: number;
    bodega: string;
    cantidad: number;
    producto_referencia: string;
  }
  