# Epic 02: Core Data - Gestión de Productos y Categorías

## Descripción
Esta épica implementa la gestión completa del catálogo de productos, incluyendo operaciones CRUD, categorización, búsqueda avanzada, manejo de imágenes y alertas de stock. Es fundamental para el funcionamiento del sistema de inventario.

## Objetivos
- Implementar CRUD completo de productos
- Establecer sistema de categorías para organización
- Habilitar búsqueda y filtrado eficiente de productos
- Implementar alertas de stock bajo
- Gestionar imágenes de productos
- Calcular márgenes de ganancia automáticamente

## Roles con Acceso
- **Admin**: Acceso completo (CRUD)
- **Gerente de Almacén**: Acceso completo (CRUD)
- **Personal de Ventas**: Solo lectura (consulta de productos)

## Historias de Usuario
1. **US-PROD-001**: Crear Producto
2. **US-PROD-002**: Listar Productos
3. **US-PROD-003**: Buscar y Filtrar Productos
4. **US-PROD-004**: Ver Detalles de Producto
5. **US-PROD-005**: Editar Producto
6. **US-PROD-006**: Eliminar Producto
7. **US-PROD-007**: Gestionar Categorías de Productos
8. **US-PROD-008**: Alertas de Stock Bajo
9. **US-PROD-009**: Carga de Imagen de Producto
10. **US-PROD-010**: Cálculo de Margen de Ganancia

## Dependencias
- Epic 01 (Foundation) debe estar completa
- Base de datos configurada
- Sistema de autenticación funcional

## Modelo de Datos Principal
```
Product:
  - id (PK)
  - sku (único)
  - name
  - description
  - cost_price
  - sale_price
  - stock
  - reorder_point
  - category_id (FK)
  - image_url
  - created_at
  - updated_at

Category:
  - id (PK)
  - name
  - description
  - created_at
```

## Criterios de Éxito
- ✓ Productos pueden crearse, editarse, eliminarse y consultarse
- ✓ Sistema de categorías operativo
- ✓ Búsqueda y filtros funcionando correctamente
- ✓ Imágenes se cargan y almacenan correctamente
- ✓ Alertas de stock bajo configurables y visibles
- ✓ Márgenes de ganancia calculados automáticamente
- ✓ Validación de SKU único

## Stack Técnico
- Backend: Flask + SQLAlchemy
- Base de datos: PostgreSQL
- Almacenamiento de imágenes: Sistema de archivos local o S3
- Frontend: React/Vue con formularios validados

## Prioridad
**ALTA** - Debe completarse antes de Epic 03 (Inventario)
