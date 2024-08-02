from flask_app import db

class SharedSchedule(db.Model):
    __tablename__ = "shared_schedule"
    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    modifiable = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    added_date = db.Column(db.DateTime, nullable=False)

class NoneSharedSchedule(db.Model):
    __tablename__ = "none_shared_schedule"
    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    modifiable = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    added_date = db.Column(db.DateTime, nullable=False)
