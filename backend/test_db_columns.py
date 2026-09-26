import pymysql

# Connect to database
connection = pymysql.connect(
    host="127.0.0.1",
    user="root",
    password="Vani@#2005",
    database="scholarship_db"
)
try:
    with connection.cursor() as cursor:
        cursor.execute("DESCRIBE Scholarship_AI_Ready")
        rows = cursor.fetchall()
        for r in rows:
            print(r)
finally:
    connection.close()
