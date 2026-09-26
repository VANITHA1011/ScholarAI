import pymysql

connection = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="Vani@#2005",
    database="scholarship_db"
)
try:
    with connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM user_profiles LIKE 'quota'")
        result = cursor.fetchone()
        if not result:
            print("Adding quota column to user_profiles...")
            cursor.execute("ALTER TABLE user_profiles ADD COLUMN quota VARCHAR(100) DEFAULT 'General'")
            print("quota column added successfully!")
        else:
            print("quota column already exists.")
except Exception as e:
    print(f"Error: {e}")
finally:
    connection.close()
