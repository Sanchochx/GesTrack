"""
Script simple para visualizar datos de la base de datos
"""
import sqlite3
import os
import sys
from datetime import datetime

# Fix para encoding en Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Ruta a la base de datos (en carpeta instance)
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'gestrack.db')

def view_users():
    """Muestra todos los usuarios en la base de datos"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Obtener todos los usuarios
        cursor.execute("SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC")
        users = cursor.fetchall()

        if not users:
            print("❌ No hay usuarios en la base de datos")
            return

        print(f"\n{'='*100}")
        print(f"🗄️  USUARIOS EN LA BASE DE DATOS ({len(users)} total)")
        print(f"{'='*100}\n")

        # Header
        print(f"{'ID':<38} | {'Nombre':<25} | {'Email':<30} | {'Rol':<20} | Activo | Creado")
        print("-" * 100)

        # Datos
        for user in users:
            user_id, full_name, email, role, is_active, created_at = user
            active_str = "✅ Sí" if is_active else "❌ No"
            created_date = created_at.split('.')[0] if '.' in created_at else created_at

            print(f"{user_id:<38} | {full_name:<25} | {email:<30} | {role:<20} | {active_str:^6} | {created_date}")

        print(f"\n{'='*100}\n")

        conn.close()

    except sqlite3.Error as e:
        print(f"❌ Error al acceder a la base de datos: {e}")
    except FileNotFoundError:
        print(f"❌ No se encontró la base de datos en: {db_path}")

def view_table_info():
    """Muestra información sobre las tablas"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Obtener lista de tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        print(f"\n{'='*80}")
        print(f"📊 TABLAS EN LA BASE DE DATOS")
        print(f"{'='*80}\n")

        for table in tables:
            table_name = table[0]
            if table_name == 'alembic_version':
                continue

            # Contar registros
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]

            # Ver estructura
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()

            print(f"📋 Tabla: {table_name}")
            print(f"   Registros: {count}")
            print(f"   Columnas: {', '.join([col[1] for col in columns])}")
            print()

        conn.close()

    except sqlite3.Error as e:
        print(f"❌ Error: {e}")

def main():
    """Función principal"""
    print("\n🎯 VISUALIZADOR DE BASE DE DATOS - GesTrack")
    print(f"📁 Ubicación: {db_path}\n")

    if not os.path.exists(db_path):
        print("❌ La base de datos no existe aún. Ejecuta el backend primero.")
        return

    # Mostrar información de tablas
    view_table_info()

    # Mostrar usuarios
    view_users()

if __name__ == "__main__":
    main()
