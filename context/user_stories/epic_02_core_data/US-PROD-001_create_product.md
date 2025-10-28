# US-PROD-001: Crear Producto

## Historia de Usuario
**Como** gerente de almacén,
**quiero** poder registrar nuevos productos en el sistema,
**para** mantener actualizado el catálogo de productos disponibles.

## Prioridad
**Alta**

## Estimación
8 Story Points

## Criterios de Aceptación

### CA-1: Formulario de Creación
El formulario incluye los siguientes campos:
- **Nombre**: Campo de texto (requerido, max 200 caracteres)
- **SKU**: Campo de texto único (requerido, max 50 caracteres, alfanumérico)
- **Descripción**: Área de texto (opcional, max 1000 caracteres)
- **Precio de Costo**: Campo numérico (requerido, positivo, 2 decimales)
- **Precio de Venta**: Campo numérico (requerido, positivo, 2 decimales)
- **Stock Inicial**: Campo numérico entero (requerido, ≥0)
- **Punto de Reorden**: Campo numérico entero (opcional, por defecto 10)
- **Categoría**: Selector desplegable (requerido)
- **Imagen**: Cargador de archivo (opcional)

### CA-2: Validación de SKU Único
- El SKU debe ser único en todo el sistema
- Si se ingresa un SKU existente, muestra error: "Este SKU ya está registrado"
- La validación se ejecuta al perder foco del campo (onBlur)
- Indicador visual de SKU válido/inválido

### CA-3: Validación de Precios
- Los precios deben ser valores numéricos positivos mayores a 0
- El precio de venta debe ser mayor o igual al precio de costo
- Si precio venta < precio costo, muestra warning: "El precio de venta es menor al costo. ¿Estás seguro?"
- Se permite continuar pero con confirmación

### CA-4: Cálculo de Margen
- El margen de ganancia se calcula automáticamente: `((Precio Venta - Precio Costo) / Precio Costo) * 100`
- Se muestra en tiempo real mientras el usuario ingresa precios
- Formato: "Margen: X.XX%"
- Código de colores: verde (>30%), amarillo (15-30%), rojo (<15%)

### CA-5: Carga de Imagen
- Formatos aceptados: JPG, PNG, WEBP
- Tamaño máximo: 5MB
- Si el archivo excede el tamaño, muestra error: "La imagen no debe superar 5MB"
- Preview de la imagen antes de guardar
- Si no se carga imagen, usa placeholder por defecto

### CA-6: Registro en Inventario
- El stock inicial se registra automáticamente en el historial de movimientos de inventario
- Tipo de movimiento: "Stock Inicial"
- Usuario: el que crea el producto
- Fecha: timestamp actual

### CA-7: Confirmación y Redirección
- Al guardar exitosamente, muestra mensaje: "Producto creado correctamente"
- Redirige a la página de detalles del producto recién creado
- O muestra opción: "Crear otro producto" / "Ver producto"

### CA-8: Manejo de Errores
- Validaciones en tiempo real (frontend) y al enviar (backend)
- Mensajes de error claros junto a cada campo
- Si falla el guardado, mantener datos en formulario para no perder información
- Errores de servidor se muestran en notificación general

## Notas Técnicas
- API endpoint: `POST /api/products`
- Validación de unicidad de SKU en backend antes de guardar
- Optimización de imagen antes de almacenar (resize si es muy grande)
- Nombrar archivos de imagen: `{sku}_{timestamp}.{extension}`
- Trigger automático para crear registro de movimiento de inventario

## Definición de Hecho
- [ ] Frontend: Formulario de creación implementado
- [ ] Frontend: Validaciones en tiempo real
- [ ] Frontend: Preview de imagen funcional
- [ ] Backend: API POST /api/products implementado
- [ ] Backend: Validación de SKU único
- [ ] Backend: Validación de todos los campos
- [ ] Base de datos: Tabla products creada
- [ ] Optimización y almacenamiento de imágenes
- [ ] Registro automático en historial de inventario
- [ ] Cálculo de margen de ganancia
- [ ] Pruebas unitarias y de integración
- [ ] Documentación de API

## Dependencias
- US-PROD-007 (Categorías) debe estar completo
- Epic 01 (Autenticación) debe estar completa
- Sistema de carga de archivos configurado

## Tags
`products`, `crud`, `create`, `high-priority`
