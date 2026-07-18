import sqlite3
conn = sqlite3.connect('scannie.db')
cursor = conn.cursor()
cursor.execute("DELETE FROM users")
conn.commit()
print(f"Deleted {cursor.rowcount} users")
conn.close()
