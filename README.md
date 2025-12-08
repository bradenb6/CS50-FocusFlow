# CS50-FocusFlow
Productivity Dashboard

A full-featured personal productivity system built with Flask and SQLite
Goals • Tasks • Journal • Study Sessions • Daily Events

Overview

  This is a complete productivity dashboard that combines several tools into one interface:
  -  Task manager
  -  Goal tracker
  -  Daily event calendar
  -  Journal system
  -  Study session tracker (Pomodoro-style)
Built using Flask, SQLite, and vanilla JS, the project is lightweight, fast, and easy to    deploy.

Features
  Tasks
  -  Add, edit, delete tasks
  -  Organized by deadline
  -  Simple, clean user interface

  Goals
  -  long-term goal tracking
  -  Edit + delete
  -  Automatically sorted

  Journals

  -  Write entries by date
  -  Edit entries inline with AJAX
  -  Delete entries
  -  Study Sessions
  -  Log timed study sessions
    
  Add notes
  -  View what you've done each day
  -  Edit/delete past sessions

  Daily Event Calendar
  -  24-hour grid
  -  Color-coded events
  -  Add, edit, delete events
  -  Event modals with category -> color mapping

Installation
1. Clone the repo. 
At the green code button, download folder. This will give you a zip folder. Find Zip folder in download and press extract all. 

2. Install dependencies
Install VS code and python if not done already

3. Open Folder
In VS code upload folder to VS code

5. Run the server
using the function python app.py

6. Open in browser
Find HTML link in browser

Database Schema

The database initializes automatically on startup. Defined in app.py 

Tables Created:
  -  goals
  -  tasks
  -  journals
  -  study_sessions
  -  events

(See app.py for full schema.)

API Endpoints
Tasks
Method	Route	Description
GET	/tasks	View tasks
POST	/tasks	Add task
POST	/tasks/edit/<id>	Edit task
POST	/tasks/delete/<id>	Delete task
Goals
Method	Route	Description
GET	/goals	View goals
POST	/goals	Add goal
POST	/goals/edit/<id>	Edit goal
POST	/goals/delete/<id>	Delete goal
Journal
Method	Route	Description
GET	/journal	View journal
POST	/journal	Add entry
POST	/journal/delete/<id>	Delete entry
POST	/journal/edit/<id>	Edit entry (AJAX)
Study Sessions
Method	Route
POST	/save_session
GET	/session_totals
GET	/history/<date>
GET	/day_details/<date>
POST	/delete_session/<id>
POST	/edit_session/<id>
Events
Method	Route	Description
POST	/events	Create event
GET	/events/<date>	Get events for day
POST	/events/edit/<id>	Edit event
POST	/events/delete/<id>	Delete event
GET	/day?date=YYYY-MM-DD	Day view

Frontend Highlights

  - Pure JavaScript (no frameworks required)

  - Dynamic calendar grid generation

  - Event modals

  - Inline journal editing

  - Auto-refresh after updates

Persistence

  All data is stored in SQLite (database.db), making this project:

  -  Lightweight
  -  Portable
  -  Easy to back up
  -  Zero-configuration

Development

  To reset the database:

  -  rm database.db
  -  python app.py

  The app will recreate all tables automatically.

Video with implementation and presentation of project
- https://youtu.be/LrYy6tI94-4
  
License

  MIT License — free to use, modify, and share.

Acknowledgments

If you use this project in your portfolio or school work,
consider giving the GitHub repo a star to support it.
