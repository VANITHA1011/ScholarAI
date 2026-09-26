import pymysql

connection = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="Vani@#2005",
    database="scholarship_db"
)
try:
    with connection.cursor() as cursor:
        # Check if id column already exists
        cursor.execute("SHOW COLUMNS FROM Scholarship_AI_Ready LIKE 'id'")
        result = cursor.fetchone()
        if not result:
            print("Adding id column to Scholarship_AI_Ready...")
            cursor.execute("ALTER TABLE Scholarship_AI_Ready ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST")
            print("id column added successfully!")
        else:
            print("id column already exists.")
except Exception as e:
    print(f"Error: {e}")
finally:
    connection.close()
