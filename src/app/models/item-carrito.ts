export interface ItemCarrito {
    product_id: string;
    producto_referencia: string;
    cantidad: number;
    bodega: string; 
    nombre: string;
    precio: number;
    factor: string;
    descuento: number;
    subtotal?: number;
}
