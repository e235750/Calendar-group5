from flask import Blueprint, render_template, request, jsonify, session
import calendar
import datetime
import os
import uuid
from cryptography.fernet import Fernet
from flask_app import db
from flask_app.models import User, SharedSchedule, NoneSharedSchedule

index_bp = Blueprint('index', __name__, url_prefix='/')
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
cipher_suite = Fernet(ENCRYPTION_KEY)

#指定した年、月のデータ取得
def get_monthly_data(year, month):
    month_data = calendar.monthrange(year, month) #(曜日0~6,月の日数)タプル形式
    month_range = month_data[1]
    first_day = month_data[0]

    return {"year": year, "month": month, "month_range": month_range, "first_day": first_day}

#カレンダーHTML作成
def create_calendar(_year=-1, _month=-1):
    if(_year == -1 or _month == -1 or _month > 12 or _month < 1):
        dt_now = datetime.datetime.now()
        year = dt_now.year
        month = dt_now.month
    else:
        year = _year
        month = _month
    month_data = get_monthly_data(year, month)
    html = """
                <tr>
                    <th>日</th>
                    <th>月</th>
                    <th>火</th>
                    <th>水</th>
                    <th>木</th>
                    <th>金</th>
                    <th>土</th>
                </tr>
            """
    for day in range(42):
        #週の最初か
        if day % 7 == 0:
            html += "<tr class='date-row'>"
        #曜日は日曜日か
        if month_data["first_day"] == 6:
            #月の範囲を超えているか
            if day+1 <= month_data["month_range"]:
                html += f"<td id=td-{day - month_data['first_day']} class='exi'><div class='date-num'>{day+1}</div></td>"
            else:
                html += "<td></td>"
        else:
            #月の範囲内か
            if day > month_data["first_day"] and day - month_data["first_day"] <= month_data["month_range"]:
                html += f"<td id=td-{day - month_data['first_day']} class='exi'><div class='date-num'>{day - month_data['first_day']}</div></td>"
            else:
                html += "<td></td>"
        #週の最後か
        if day % 7 == 6:
            html += "</tr>"

    return {"html": html}

#追加フォームHTMLを渡す
@index_bp.route("/get_add_form", methods=["GET"])
def get_add_form():
    #スケジュル追加フォーム
    html = """
            <div class="add-form">
                <div class="tab"><span id="add-content">スケジュールの追加</span><span id="back">×</span></div>
                <input type="text" id="title" placeholder="タイトルを追加">
                <div id="time"><input type="datetime-local" class="period" id="start"><span id="separator">–</span><input type="datetime-local" class="period" id="end"></div>
                <div id="options">
                    <div id="shared-option">
                    <input type="radio" id="shared" class="shared-options" name="shared-options" value="1" checked/>
                    <label for="shared">共有</label>
                    </div>
                    <div id="none-shared-option">
                    <input type="radio" id="none-shared" class="shared-options" name="shared-options" value="0"/>
                    <label for="none-shared">非共有</label>
                    </div>
                </div>
                <div id="caution">
                    <ul>
                    <li id="length-caution">・文字数は100文字以内である必要があります</li>
                    <li id="period-caution">・予定日を正しく追加してください</li>
                    <li id="title-caution">・タイトルを追加してください</li>
                    </ul>
                </div>
                <div id="select">
                    <div id="cancel">キャンセル</div>
                    <div id="add">追加</div>
                </div>
            </div>
            """
    return jsonify({"html": html})

#カレンダーHTMLを渡す
@index_bp.route("/get_calendar", methods=["GET"])
def get_calendar():
    year = request.args.get("year", type=int, default=datetime.datetime.now().year)
    month = request.args.get("month", type=int, default=datetime.datetime.now().month)
    calendar_data = create_calendar(year, month)
    return jsonify(calendar_data)

#共有スケジュールの登録
@index_bp.route("/set_shared_schedule", methods=["POST"])
def set_shared_schedule():
    data = request.get_json()
    created_data = create_schedule_data(data)

    schedule = SharedSchedule(
        title = data["title"],
        start_time = created_data["start_time_dt"],
        end_time = created_data["end_time_dt"],
        added_date = created_data["added_date_dt"],
    )
    db.session.add(schedule)
    db.session.commit()

    return jsonify({"response": "共有スケジュール登録"})

#非共有スケジュールの登録
@index_bp.route("/set_none_shared_schedule", methods=["POST"])
def set_none_shared_schedule():
    data = request.get_json()
    created_data = create_schedule_data(data)

    #ユーザーIDがない場合は作成
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())
    #ユーザーIDの暗号化
    user_id = session["user_id"]
    user_id = user_id.encode('utf-8')
    encrypted_user_id = str(cipher_suite.encrypt(user_id))

    schedule = NoneSharedSchedule(
        title = data["title"],
        user_id = encrypted_user_id,
        start_time = created_data["start_time_dt"],
        end_time = created_data["end_time_dt"],
        added_date = created_data["added_date_dt"],
    )
    db.session.add(schedule)
    db.session.commit()

    return jsonify({"response": "非共有スケジュール登録"})

#レスポンスからスケジュールデータ作成
def create_schedule_data(data):
    start_time = data.get("start_time", {})
    end_time = data.get("end_time", {})
    added_date = data.get("added_date", {})
    def convert_time(time_dict):
        return [
            int(time_dict.get("year")),
            int(time_dict.get("month")),
            int(time_dict.get("day")),
            int(time_dict.get("hour")),
            int(time_dict.get("minute"))
        ]
    start_time = convert_time(start_time)
    end_time = convert_time(end_time)
    added_date = convert_time(added_date)

    start_time_dt = datetime.datetime(*start_time)
    end_time_dt = datetime.datetime(*end_time)
    added_date_dt = datetime.datetime(*added_date)

    return {"start_time_dt": start_time_dt, "end_time_dt": end_time_dt, "added_date_dt": added_date_dt}

@index_bp.route("/", methods=["GET", "POST"])
def index():
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())

    return render_template("index.html")