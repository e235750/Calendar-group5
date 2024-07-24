from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    # appの設定
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_pyfile('config.py')
    app.secret_key = os.getenv("SECRET_KEY")


    # DBの設定
    db.init_app(app)
    from flask_app import models

    with app.app_context():
        db.create_all()

    # Blueprintの登録
    from flask_app.controllers.index import index_bp
    app.register_blueprint(index_bp)

    return app