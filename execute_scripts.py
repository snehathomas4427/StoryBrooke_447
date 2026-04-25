#cd /Users/snehathomas/447test
#source venv/bin/activate
#python execute_scripts.py

import mysql.connector
from mysql.connector import Error

database_name = "StoryBrooke"
create_table_script = "create_table.sql"
insert_data_script = "insert_data.sql"

def execute_sql_script(connection, script_path):
    try:
        with open(script_path, 'r') as file:
            sql_script = file.read()
            cursor = connection.cursor()
            for statement in sql_script.split(';'):
                if statement.strip():
                    cursor.execute(statement)
            connection.commit()
            print(f"Successfully executed script {script_path}")
    except Exception as e:
        print(f"Failed to execute scipt {script_path}:{e}")

def main():
    connection = None
    try:
        connection = mysql.connector.connect(
            host = "mysql-493f1ce-snehavechoor-9509.b.aivencloud.com",
            user = "avnadmin",
            password = "AVNS_kOsb_af8qwPk7TDILBe",
            port = 21996,
            database="defaultdb",
            ssl_disabled=False
        )
        if connection.is_connected():
            print("Connected to MySql server!")
            
            cursor = connection.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
            connection.database = database_name #connect to DB
            #execute the script
            execute_sql_script(connection, create_table_script)
            execute_sql_script(connection, insert_data_script)
    except Error as e:
        print(f"Error: {e}")
        
    finally:
        if connection and connection.is_connected():
            connection.close()
        print("Closed connection to MySQL server.")
        
if __name__ == "__main__":
    main()