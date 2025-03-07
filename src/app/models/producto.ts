export interface ListaPrecio {
    ico: string;
    lista: string;
    noiva: number;
    precio: number;
  }
  
  export interface Producto {
    id: string;
    nombre: string;
    referencia: string;
    tipo: string;
    factor: string;
    disponible: string;
    bodega: string;
    bod_id: string;
    descuento: number;
    lista_precio: ListaPrecio[];  
  }
  