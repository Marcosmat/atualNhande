from flask import Flask, request, jsonify, g
from flask_cors import CORS
import os
import sqlite3

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'users.db')

app = Flask(__name__)
CORS(app)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/api/users', methods=['GET'])
def list_users():
    db = get_db()
    cur = db.execute('SELECT id, name, email, role, matricula, matricula_funcional, created_at FROM users')
    rows = cur.fetchall()
    users = [dict(r) for r in rows]
    return jsonify(users)


@app.route('/health', methods=['GET'])
def health():
    """Rota simples para verificar se o servidor está vivo."""
    ok = os.path.exists(DB_PATH)
    return jsonify({'status': 'ok' if ok else 'missing-db', 'db_path': DB_PATH}), (200 if ok else 500)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'ok': False, 'error': 'missing_fields'}), 400

    db = get_db()
    cur = db.execute('SELECT id, name, email, role, matricula, matricula_funcional FROM users WHERE email = ? AND password = ?', (email, password))
    user = cur.fetchone()
    if not user:
        return jsonify({'ok': False, 'error': 'invalid_credentials'}), 401

    user = dict(user)
    return jsonify({'ok': True, 'user': user})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    role = data.get('role')
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    matricula = data.get('matricula')
    matricula_func = data.get('matricula_funcional')

    if not role or not name or not email or not password:
        return jsonify({'ok': False, 'error': 'missing_fields'}), 400

    if role not in ('aluno','professor','visitante'):
        return jsonify({'ok': False, 'error': 'invalid_role'}), 400

    # Validate required matricula per role
    if role == 'aluno' and not matricula:
        return jsonify({'ok': False, 'error': 'missing_matricula'}), 400
    if role == 'professor' and not matricula_func:
        return jsonify({'ok': False, 'error': 'missing_matricula_funcional'}), 400

    db = get_db()
    try:
        db.execute(
            'INSERT INTO users (name, email, password, role, matricula, matricula_funcional) VALUES (?,?,?,?,?,?)',
            (name, email, password, role, matricula, matricula_func)
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({'ok': False, 'error': 'email_exists'}), 409

    cur = db.execute('SELECT id, name, email, role, matricula, matricula_funcional FROM users WHERE email = ?', (email,))
    user = dict(cur.fetchone())
    return jsonify({'ok': True, 'user': user}), 201


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print('Banco não encontrado: rodando init_db para criar e popular com usuários de teste...')
        from init_db import init_db
        init_db()
    print('Executando backend Flask — banco em:', DB_PATH)
    print('Acesse: http://127.0.0.1:5000   (endpoints: /api/users, /api/login, /api/register, /health)')
    app.run(host='127.0.0.1', port=5000, debug=True)
