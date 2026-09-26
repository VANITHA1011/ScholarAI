from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("=== TABLES ===")
    tables = conn.execute(text("SHOW TABLES")).fetchall()
    for t in tables:
        tname = t[0]
        cnt = conn.execute(text(f"SELECT COUNT(*) FROM `{tname}`")).scalar()
        print(f"Table: {tname} | Count: {cnt}")

    print("\n=== FOREIGN KEYS ===")
    fks = conn.execute(text("""
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    """)).fetchall()
    for fk in fks:
        print(dict(fk._mapping))
