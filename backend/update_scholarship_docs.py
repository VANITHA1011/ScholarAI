import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='Vani@#2005', database='scholarship_db')
cursor = conn.cursor()

# Document requirements mapping
doc_mapping = {
    1: 'college,tenth,twelfth',
    2: 'college,income',
    3: 'college,income,twelfth',
    4: 'college,income,twelfth',
    5: 'college,income,disability',
    6: 'community,income',
    7: 'college,income',
    8: 'college,community',
    9: 'college,tenth,twelfth',
    10: 'community,income',
    11: 'community,income',
    12: 'community,income',
    13: 'community,income',
    14: 'college',
    15: 'community,income',
    16: 'college',
    17: 'tenth,income',
    18: 'college,income,disability',
    19: 'college,income',
    20: 'tenth,income',
    21: 'college,income',
    22: 'tenth,income',
    23: 'college,income',
    24: 'college',
    25: 'tenth,income',
    26: 'college,income',
    27: 'college',
    28: 'college,income',
    29: 'tenth,income',
    30: 'college,income',
    31: 'college,income',
    32: 'college,income',
    33: 'college,tenth,twelfth',
    34: 'college',
    35: 'college,income',
    36: 'college',
    37: 'college,income',
    38: 'college,income',
    39: 'college',
    40: 'college,income',
    41: 'college',
    42: 'college',
    43: 'college',
    44: 'college,income',
    45: 'college,tenth,twelfth',
    46: 'college',
    47: 'college',
    48: 'college',
    49: 'tenth,twelfth',
    50: 'college,income',
    51: 'community,income',
    52: 'community,income',
    53: 'community,income',
    54: 'community,income'
}

for sch_id, docs in doc_mapping.items():
    cursor.execute(
        "UPDATE Scholarship_AI_Ready SET required_documents = %s WHERE id = %s",
        (docs, sch_id)
    )

conn.commit()
print("Successfully updated required_documents for all scholarships!")
conn.close()
