# Hardware soportado

FactuTienda EC soporta los siguientes perifericos sin dependencias externas.

## Impresora termica ESC/POS

Soporte nativo via `python-escpos`. Compatible con:

- Epson TM-T20 / TM-T88
- Bixolon SRP-350
- Zebra (modo ESC/POS)
- Cualquier impresora termica compatible ESC/POS

### Configuracion

Conexion via USB, red o serial. La libreria `python-escpos` detecta automaticamente.

## Scanner de codigo de barras

Soporte nativo via entrada de teclado (HID). Cualquier scanner USB funciona.

- Lee y emula teclado automaticamente
- Compatible con codigos EAN8, EAN13, CODE128
- El POS captura el evento de teclado sin configuracion adicional

## Generador de etiquetas

- Genera etiquetas en PDF listas para imprimir
- Soporta CODE128, EAN13, EAN8
- Incluye QR opcional
- Tamanos: sticker pequeno (50x30mm), mediano (80x40mm), hoja A4
- Ver `POST /api/v1/etiquetas/generar`

## Codigos QR

- Generacion offline sin APIs externas
- QR para productos: nombre + precio + codigo
- QR para facturas SRI: incluido en el RIDE

## Impresion de RIDE

- PDF generado con reportlab
- Incluye QR con datos de factura
- Listo para impresion en cualquier impresora

## Cajon monedero

- Compatible via puerto de impresora termica (protocolo ESC/POS)
- Se activa automaticamente al imprimir ticket
