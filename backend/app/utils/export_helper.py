"""
Helper para exportación de datos a CSV y Excel

US-INV-003: CA-6 - Export functionality
"""
import csv
import io
from datetime import datetime
from flask import Response


class ExportHelper:
    """Helper para exportar datos a diferentes formatos"""

    @staticmethod
    def export_to_csv(data, columns, filename_prefix='export'):
        """
        Exporta datos a formato CSV

        Args:
            data: Lista de diccionarios con los datos
            columns: Lista de tuplas (key, header_name) que define las columnas
            filename_prefix: Prefijo para el nombre del archivo

        Returns:
            Flask Response con el archivo CSV
        """
        # Crear un buffer de texto en memoria
        si = io.StringIO()

        # Crear writer CSV
        writer = csv.writer(si, quoting=csv.QUOTE_ALL)

        # Escribir encabezados
        headers = [col[1] for col in columns]
        writer.writerow(headers)

        # Escribir datos
        for row in data:
            row_data = []
            for col_key, _ in columns:
                value = row.get(col_key, '')
                # Formatear valores especiales
                if value is None:
                    value = ''
                elif isinstance(value, datetime):
                    value = value.strftime('%Y-%m-%d %H:%M:%S')
                elif isinstance(value, bool):
                    value = 'Sí' if value else 'No'
                row_data.append(str(value))
            writer.writerow(row_data)

        # Preparar respuesta
        output = si.getvalue()
        si.close()

        # Generar nombre de archivo con timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'{filename_prefix}_{timestamp}.csv'

        # Crear respuesta
        response = Response(
            output,
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename={filename}',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )

        return response

    @staticmethod
    def export_inventory_movements_to_csv(movements):
        """
        Exporta movimientos de inventario a CSV (US-INV-003 CA-6)

        Args:
            movements: Lista de diccionarios de movimientos

        Returns:
            Flask Response con el archivo CSV
        """
        # Definir columnas para exportación
        columns = [
            ('created_at', 'Fecha y Hora'),
            ('product_name', 'Producto'),
            ('product_sku', 'SKU'),
            ('movement_type', 'Tipo de Movimiento'),
            ('quantity', 'Cantidad'),
            ('previous_stock', 'Stock Anterior'),
            ('new_stock', 'Stock Resultante'),
            ('user_name', 'Usuario'),
            ('reason', 'Motivo'),
            ('reference', 'Referencia'),
            ('notes', 'Notas')
        ]

        return ExportHelper.export_to_csv(
            data=movements,
            columns=columns,
            filename_prefix='historial_inventario'
        )

    @staticmethod
    def export_to_excel(data, columns, filename_prefix='export', sheet_name='Datos'):
        """
        Exporta datos a formato Excel (XLSX)

        Requiere openpyxl: pip install openpyxl

        Args:
            data: Lista de diccionarios con los datos
            columns: Lista de tuplas (key, header_name)
            filename_prefix: Prefijo para el nombre del archivo
            sheet_name: Nombre de la hoja

        Returns:
            Flask Response con el archivo Excel
        """
        try:
            from openpyxl import Workbook
            from openpyxl.styles import Font, PatternFill, Alignment
            from openpyxl.utils import get_column_letter
        except ImportError:
            # Si openpyxl no está instalado, retornar CSV como fallback
            return ExportHelper.export_to_csv(data, columns, filename_prefix)

        # Crear workbook
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name

        # Estilo para encabezados
        header_font = Font(bold=True, color='FFFFFF')
        header_fill = PatternFill(start_color='2e7d32', end_color='2e7d32', fill_type='solid')
        header_alignment = Alignment(horizontal='center', vertical='center')

        # Escribir encabezados
        headers = [col[1] for col in columns]
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment

        # Escribir datos
        for row_num, row in enumerate(data, 2):
            for col_num, (col_key, _) in enumerate(columns, 1):
                value = row.get(col_key, '')

                # Formatear valores especiales
                if value is None:
                    value = ''
                elif isinstance(value, datetime):
                    value = value.strftime('%Y-%m-%d %H:%M:%S')
                elif isinstance(value, bool):
                    value = 'Sí' if value else 'No'

                ws.cell(row=row_num, column=col_num, value=value)

        # Ajustar ancho de columnas
        for col_num in range(1, len(columns) + 1):
            column_letter = get_column_letter(col_num)
            ws.column_dimensions[column_letter].width = 15

        # Guardar en memoria
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        # Generar nombre de archivo con timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'{filename_prefix}_{timestamp}.xlsx'

        # Crear respuesta
        response = Response(
            output.getvalue(),
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename={filename}',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        )

        return response

    @staticmethod
    def export_inventory_movements_to_excel(movements):
        """
        Exporta movimientos de inventario a Excel (US-INV-003 CA-6)

        Args:
            movements: Lista de diccionarios de movimientos

        Returns:
            Flask Response con el archivo Excel
        """
        # Definir columnas para exportación
        columns = [
            ('created_at', 'Fecha y Hora'),
            ('product_name', 'Producto'),
            ('product_sku', 'SKU'),
            ('movement_type', 'Tipo de Movimiento'),
            ('quantity', 'Cantidad'),
            ('previous_stock', 'Stock Anterior'),
            ('new_stock', 'Stock Resultante'),
            ('user_name', 'Usuario'),
            ('reason', 'Motivo'),
            ('reference', 'Referencia'),
            ('notes', 'Notas')
        ]

        return ExportHelper.export_to_excel(
            data=movements,
            columns=columns,
            filename_prefix='historial_inventario',
            sheet_name='Movimientos de Inventario'
        )
