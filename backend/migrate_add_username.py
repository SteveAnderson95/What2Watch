# Script simple pour ajouter username sans perdre les données existantes

import os
import psycopg2


def main():
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/what2watch")

    conn = psycopg2.connect(database_url)
    cur = conn.cursor()

    # 1) Ajouter la colonne (nullable temporairement)
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR;")

    # 2) Donner un username par défaut aux anciens users
    cur.execute(
        """
        UPDATE users
        SET username = 'user_' || id::text
        WHERE username IS NULL OR username = '';
        """
    )

    # 3) Rendre username obligatoire + unique
    cur.execute("ALTER TABLE users ALTER COLUMN username SET NOT NULL;")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);")

    conn.commit()
    cur.close()
    conn.close()

    print("✅ Migration terminée : colonne username ajoutée")


if __name__ == "__main__":
    main()
