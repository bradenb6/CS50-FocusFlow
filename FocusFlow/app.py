from flask import Flask, render_template, request, redirect, jsonify
import sqlite3

app = Flask(__name__)

DB_NAME = "database.db"
def get_db():
    conn = sqlite3.connect(DB_NAME, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            deadline TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS journals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            content TEXT NOT NULL
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            seconds INTEGER NOT NULL,
            notes TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            title TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            category TEXT,
            color TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            deadline TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

init_db()

@app.route('/goals/delete/<int:id>', methods=["POST"])
def delete_goal(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM goals WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/goals")

@app.route("/goals/edit/<int:id>", methods=["POST"])
def edit_goal(id):
    title = request.form["goal"]
    description = request.form["description"]
    deadline = request.form["deadline"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE goals
        SET title = ?, description = ?, deadline = ?
        WHERE id = ?
    """, (title, description, deadline, id))

    conn.commit()
    conn.close()

    return redirect("/goals")

@app.route('/')
def index():
    return render_template("index.html")

@app.route("/save_session", methods=["POST"])
def save_session():
    data = request.get_json()
    date = data["date"]
    seconds = data["seconds"]
    notes = data["notes"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO study_sessions (date, seconds, notes)
        VALUES (?, ?, ?)
    """, (date, seconds, notes))

    conn.commit()
    conn.close()

    return ("", 204)

@app.route("/session_totals")
def session_totals():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT date, SUM(seconds)
        FROM study_sessions
        GROUP BY date
    """)

    rows = cur.fetchall()
    conn.close()

    return {row[0]: row[1] for row in rows}


@app.route("/history/<date>")
def day_history(date):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT seconds, notes
        FROM study_sessions
        WHERE date = ?
    """, (date,))

    rows = cur.fetchall()
    conn.close()

    return {
        "sessions": [
            {"seconds": r[0], "notes": r[1]} for r in rows
        ]
    }

@app.route("/day_details/<date>")
def day_details(date):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, seconds, notes
        FROM study_sessions
        WHERE date = ?
    """, (date,))

    rows = cur.fetchall()
    conn.close()

    return {
        "sessions": [
            {"id": r[0], "seconds": r[1], "notes": r[2] or ""}
            for r in rows
        ]
    }

@app.route("/delete_session/<int:id>", methods=["POST"])
def delete_session(id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("DELETE FROM study_sessions WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    return ("", 204)

@app.route("/edit_session/<int:id>", methods=["POST"])
def edit_session(id):
    data = request.get_json()
    seconds = data["seconds"]
    notes = data["notes"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE study_sessions
        SET seconds = ?, notes = ?
        WHERE id = ?
    """, (seconds, notes, id))

    conn.commit()
    conn.close()

    return ("", 204)

@app.route("/tasks", methods=["GET", "POST"])
def tasks():
    conn = get_db()
    cur = conn.cursor()

    if request.method == "POST":
        title = request.form["title"]
        description = request.form["description"]
        deadline = request.form["deadline"]

        cur.execute("""
            INSERT INTO tasks (title, description, deadline)
            VALUES (?, ?, ?)
        """, (title, description, deadline))
        conn.commit()

    cur.execute("SELECT * FROM tasks ORDER BY deadline")
    tasks = cur.fetchall()

    conn.close()
    return render_template("tasks.html", tasks=tasks)

@app.route("/tasks/edit/<int:id>", methods=["POST"])
def edit_task(id):
    title = request.form["title"]
    description = request.form["description"]
    deadline = request.form["deadline"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE tasks
        SET title = ?, description = ?, deadline = ?
        WHERE id = ?
    """, (title, description, deadline, id))

    conn.commit()
    conn.close()
    return redirect("/tasks")

@app.route("/tasks/delete/<int:id>", methods=["POST"])
def delete_task(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/tasks")

@app.route('/goals', methods=["GET", "POST"])
def goals():
    conn = get_db()
    cur = conn.cursor()

    if request.method == "POST":
        title = request.form["goal"]
        description = request.form["description"]
        deadline = request.form["deadline"]

        cur.execute("""
            INSERT INTO goals (title, description, deadline)
            VALUES (?, ?, ?)
        """, (title, description, deadline))

        conn.commit()
        conn.close()

        return redirect("/goals")

    # GET — fetch sorted goals
    cur.execute("SELECT * FROM goals ORDER BY deadline ASC")
    goals = cur.fetchall()
    conn.close()

    return render_template("goals.html", goals=goals)

@app.route('/journal', methods=["GET", "POST"])
def journal():
    conn = get_db()
    cur = conn.cursor()

    if request.method == "POST":
        content = request.form["entry"]
        date = request.form["date"]

        cur.execute("""
            INSERT INTO journals (date, content)
            VALUES (?, ?)
        """, (date, content))

        conn.commit()

        return redirect("/journal")

    # Fetch entries newest to oldest
    cur.execute("SELECT * FROM journals ORDER BY id DESC")
    entries = cur.fetchall()
    conn.close()
    return render_template("journal.html", entries=entries)

@app.route("/journal/delete/<int:id>", methods=["POST"])
def delete_journal(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM journals WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/journal")


@app.route("/journal/edit/<int:id>", methods=["POST"])
def edit_journal(id):
    data = request.get_json()
    new_content = data["content"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE journals SET content = ? WHERE id = ?", (new_content, id))
    conn.commit()
    conn.close()

    return ("", 204)

@app.route("/day")
def day_view():
    date = request.args.get("date")
    return render_template("days.html", date=date)

@app.route("/events", methods=["POST"])
def save_event():
    data = request.get_json()

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO events (date, title, start_time, end_time, category, color)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data["date"],
        data["title"],
        data["start_time"],
        data["end_time"],
        data["category"],
        data["color"]
    ))

    conn.commit()
    conn.close()
    return ("", 204)

@app.route("/events/<date>")
def events_for_day(date):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, start_time, end_time, category, color
        FROM events
        WHERE date = ?
        ORDER BY start_time
    """, (date,))

    rows = cur.fetchall()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "title": r[1],
            "start_time": r[2],
            "end_time": r[3],
            "category": r[4],
            "color": r[5]
        }
        for r in rows
    ])

@app.post("/events/delete/<int:id>")
def delete_event(id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("DELETE FROM events WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return ("", 204)

@app.post("/events/edit/<int:id>")
def edit_event(id):
    data = request.get_json()

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE events
        SET title = ?, start_time = ?, end_time = ?, category = ?, color = ?
        WHERE id = ?
    """, (data["title"], data["start_time"], data["end_time"],
          data["category"], data["color"], id))

    conn.commit()
    conn.close()
    return ("", 204)

if __name__ == "__main__":
    app.run(debug=True)