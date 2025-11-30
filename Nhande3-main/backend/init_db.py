import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('aluno','professor','visitante')),
    matricula TEXT,
    matricula_funcional TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
'''

USERS = [
    ('João Aluno', 'joao@example.com', '1234', 'aluno', 'A12345', None),
    ('Maria Prof', 'maria@example.com', 'abc123', 'professor', None, 'PF-9988'),
    ('Carlos Visit', 'carlos@example.com', 'visitor', 'visitante', None, None),
]


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript(SCHEMA)

    # Insert seed users if not present
    for u in USERS:
        name, email, pw, role, matricula, matricula_funcional = u
        try:
            c.execute(
                'INSERT INTO users (name, email, password, role, matricula, matricula_funcional) VALUES (?,?,?,?,?,?)',
                (name, email, pw, role, matricula, matricula_funcional)
            )
        except sqlite3.IntegrityError:
            # user exists
            pass

    conn.commit()
    conn.close()


if __name__ == '__main__':
    print('Criando o banco de dados de teste em', DB_PATH)
    init_db()
    print('Feito. Usuários de teste inseridos (se não existiam).')
