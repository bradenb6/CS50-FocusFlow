# imports flask, render_template, request, redirect, and jsonify from the flask library and then imports sqlite3
from flask import Flask, render_template, request, redirect, jsonify
import sqlite3

# creates a flask app
app = Flask(__name__)

# sets DB_NAME as database.db (the database file for this)
DB_NAME = "database.db"
# gets the database with sqlite3 and returns the data like a dictionary (conn.row_factory) and makes sure to wait before raising an error in case something else is writing to the db
def get_db():
    conn = sqlite3.connect(DB_NAME, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn

    # connects to the db and uses cursor to write to it and create a goals table, journals table, events table, study sessions table, and tasks table if they don't exist (only the first time being run)
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

    # saves the tables and closes the cursor 
    conn.commit()
    conn.close()

# runs this function
init_db()

# The route to delete a goal, goes into the goals db and deletes the goal (using the id) from it
@app.route('/goals/delete/<int:id>', methods=["POST"])
def delete_goal(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM goals WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/goals")

# goals edit route, uses post to get the goal, description, and deadline from the form made in html and js and then updates that goal using its id 
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

# route that sends the user to the index.html page (dashboard) 
@app.route('/')
def index():
    return render_template("index.html")

# save session route that uses POST and JSON to get the date, seconds, and notes and put it into the study_sessions table to save it. uses 204  because it doesn't have to return anything but it works.
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

    # route that gets the session totals by querying the db for the time spent studying on that date and returning it so the js can display each when the form is expanded
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

# gets the actual data from each day's studying and returns the time and the notes to js so it can display it when the badge is clicked
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

    # If reached by GET, this gets all of the goals in the table and returns them, if reached by POST, this gets the title, description, and deadline from the js and html and then puts them into the goals table
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

    # GET this fetches sorted goals
    cur.execute("SELECT * FROM goals ORDER BY deadline ASC")
    goals = cur.fetchall()
    conn.close()

    return render_template("goals.html", goals=goals)

    # If reached by GET, this gets the entries from newest to oldest and returns them to be displayed by the js and html, if reached by POST, this gets the entry and date from the js/html and puts it into the journals table
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

    # GET thsi fetches entries newest to oldest
    cur.execute("SELECT * FROM journals ORDER BY id DESC")
    entries = cur.fetchall()
    conn.close()
    return render_template("journal.html", entries=entries)

    # delete route for journal entries by going into the db and deleting the part of the journal table with the id for the entry 
@app.route("/journal/delete/<int:id>", methods=["POST"])
def delete_journal(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM journals WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect("/journal")

# edit route for journal entries which takes the content with JSON and updates the journals table with it where the old content was. Uses code 204 because it works but doesn't have to return anything 
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

    # if this is run (with python app.py) in the terminal, it launches flask and runs
if __name__ == "__main__":

    app.run(debug=True)


