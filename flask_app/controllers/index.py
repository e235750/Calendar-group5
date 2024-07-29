from flask import Blueprint, render_template, request, jsonify, session
from cryptography.fernet import Fernet
from flask_app import db
from flask_app.models import SharedSchedule, NoneSharedSchedule
import calendar
import datetime
import os
import uuid

from flask_app.controllers.scraping import scraping

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
                html += f"<td id=td-{day+1} class='exi'><div class='date-num'>{day+1}</div><div class='add'></div><ul class='schedule-list'></ul></td>"
            else:
                html += "<td></td>"
        else:
            #月の範囲内か
            if day > month_data["first_day"] and day - month_data["first_day"] <= month_data["month_range"]:
                html += f"<td id=td-{day - month_data['first_day']} class='exi'><div class='date-num'>{day - month_data['first_day']}</div><div class='add'></div><ul class='schedule-list'></ul></td>"
            else:
                html += "<td></td>"
        #週の最後か
        if day % 7 == 6:
            html += "</tr>"

    return {"html": html}

#カレンダーHTMLを渡す
@index_bp.route("/get_calendar", methods=["GET"])
def get_calendar():
    year = request.args.get("year", type=int, default=datetime.datetime.now().year)
    month = request.args.get("month", type=int, default=datetime.datetime.now().month)
    calendar_data = create_calendar(year, month)
    return jsonify(calendar_data)

#追加フォームHTMLを渡す
@index_bp.route("/get_add_form", methods=["GET"])
def get_add_form():
    #スケジュル追加フォーム
    html = """
            <div class="add-form show">
                <div class="tab drag-and-drop shared"><span id="add-content">スケジュールの追加</span><span id="back">×</span></div>
                <input type="text" id="title" placeholder="タイトルを追加">
                <div id="time"><input type="datetime-local" class="period" id="start" min="2023-04-01T00:00" max="2027-03-31T23:59"><span id="separator">–</span><input type="datetime-local" class="period" id="end" min="2023-04-01T00:00" max="2027-03-31T23:59"></div>
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
                    <div id="add" class="shared">追加</div>
                </div>
            </div>
            """
    return jsonify({"html": html})

#スケジュールIDに合致するスケジュールを削除する
@index_bp.route("delete_schedule", methods=["GET"])
def delete_schedule():
    schedule_id = request.args.get("schedule_id", type=int)
    shared_option = request.args.get("shared_option", type=int)

    #スケジュールの取得
    if(shared_option):
        target = db.session.query(SharedSchedule).filter(SharedSchedule.schedule_id == schedule_id).first()
    else:
        target = db.session.query(NoneSharedSchedule).filter(NoneSharedSchedule.schedule_id == schedule_id).first()
    
    db.session.delete(target)
    db.session.commit()

    return jsonify({"response": "スケジュール削除完了"})

#修正フォームHTMLを渡す
@index_bp.route("/get_update_form", methods=["GET"])
def get_update_form():
    html = """
            <div id="update-time">
                <span class="dot shared" id="dot-update"></span>
                <input type="datetime-local" class="update-period" id="update-start" min="2023-04-01T00:00" max="2027-03-31T23:59">
                <span id="update-separator">–</span>
                <input type="datetime-local" class="update-period" id="update-end" min="2023-04-01T00:00" max="2027-03-31T23:59">
            </div>
            <div id="option">
                共有設定：<span id="update-shared-option">共有</span>
            </div>
            <div id="update-caution">
                <ul>
                    <li id="length-caution">・文字数は100文字以内である必要があります</li>
                    <li id="period-caution">・予定日を正しく追加してください</li>
                    <li id="title-caution">・タイトルを追加してください</li>
                </ul>
            </div>
            <div id="select">
                <div id="cancel">キャンセル</div>
                <div id="decide" class="shared">確定</div>
            </div>
            """

    return jsonify({"html": html})

#スケジュールリストHTMLを渡す
@index_bp.route("/get_schedule_list", methods=["GET"])
def get_schedule_list():
    html = """
            <div class="schedule-form show">
                <div class="tab drag-and-drop not-modifiable">
                <span id="list">スケジュールリスト</span>
                    <span id="back">×</span>
                </div>
                <div id="scroll-box">
                    <ul id="schedule-list">
                    </ul>
                </div>
                <div id="info">
                    <div id="shared-num"><span>共有：</span><span id="shared-num-value"></span></div>
                    <div id="none-shared-num"><span>非共有：</span><span id="none-shared-num-value"></span></div>
                </div>
                <div id="select">
                    <div id="list-back" class="not-modifiable">戻る</div>
                </div>
            </div>
            """
    
    return jsonify({"html": html})

#liHTMLを渡す
@index_bp.route("/get_list_html", methods=["GET"])
def get_list_html():
    shared_option = request.args.get("shared_option", type=str)
    schedule_id = request.args.get("schedule_id", type=str)
    title = request.args.get("title", type=str)
    if(shared_option):
        option = "shared"
    else:
        option = "none-shared"
    html = f'<li class="item" id="{schedule_id}", value="{shared_option}"><span class="list-dot {option}"></span><div id="list-data" class="{option}">{title}</div></li>'
    return jsonify({"html": html})

#スケジュールIDに合致するスケジュールの修正
@index_bp.route("/update_schedule", methods=["POST"])
def update_schedule():
    data = request.get_json()
    create_data = create_schedule_data(data)
    shared_option = data["shared_option"]
    schedule_id = data["schedule_id"]
    print(data["added_date"])
    if(shared_option):
        target = db.session.query(SharedSchedule).filter(SharedSchedule.schedule_id == schedule_id).first()
    else:
        target = db.session.query(NoneSharedSchedule).filter(NoneSharedSchedule.schedule_id == schedule_id).first()

    target.title = data["title"]
    target.start_time = create_data["start_time_dt"]
    target.end_time = create_data["end_time_dt"]
    target.added_date = create_data["added_date_dt"]

    # データベースに反映
    db.session.commit()
    return jsonify({"response": "修正完了"})

#詳細HTMLを渡す
@index_bp.route("/get_detail", methods=["GET"])
def get_detail():
    html =  """
            <div class="detail show">
                <div class="tab drag-and-drop ">
                    <span id="detail-back">×</span>
                </div>
                <div id="detail-title">
                    <span class="dot " id="dot-title"></span>
                    <input type="text" id="detail-data" value="" disabled>
                </div>
                <div id="detail-time">
                    <span class="dot " id="dot-period"></span>
                    <div class="detail-period" id="detail-start">
                        <span id="detail-year"></span>-<span id="detail-month"></span>-<span id="detail-day"></span> 
                        <span id="detail-hour"></span>:<span id="detail-minute"></span>
                    </div>
                    <span id="separator">–</span>
                    <div class="detail-period" id="detail-end">
                        <span id="detail-year"></span>-<span id="detail-month"></span>-<span id="detail-day"></span> 
                        <span id="detail-hour"></span>:<span id="detail-minute"></span>
                    </div>
                </div>
                <div id="added-time">
                    追加日：<span id="added-year"></span>-<span id="added-month"></span>-<span id="added-day"></span> 
                    <span id="added-hour"></span>:<span id="added-minute"></span>
                </div>
                <div id="select">
                    <div id="update">修正</div>
                    <div id="delete" class="">削除</div>
                </div>
            </div>
            """
    return jsonify({"html": html})

#レスポンスからスケジュールデータ作成(データベース登録用)
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

#共有スケジュールの登録
@index_bp.route("/set_shared_schedule", methods=["POST"])
def set_shared_schedule():
    data = request.get_json()
    created_data = create_schedule_data(data)

    schedule = SharedSchedule(
        title = data["title"],
        modifiable = 1,
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

    user_id = session["user_id"]
    encrypted_user_id = cipher_suite.encrypt(user_id.encode('utf-8'))

    schedule = NoneSharedSchedule(
        title = data["title"],
        modifiable = 1,
        user_id = encrypted_user_id,
        start_time = created_data["start_time_dt"],
        end_time = created_data["end_time_dt"],
        added_date = created_data["added_date_dt"],
    )
    db.session.add(schedule)
    db.session.commit()

    return jsonify({"response": "非共有スケジュール登録"})

#日時の分割
def date_split(datetime):
    date, time = datetime.split()
    year, month, day = date.split('-')
    hour, minute, second = time.split(':')
    
    return {"year": int(year), "month": int(month), "day": int(day), "hour": int(hour), "minute": int(minute)}

#レスポンスの作成(JSに渡すよう)
def create_response(schedule, shared_optoin):
        response = {
            "modifiable": schedule.modifiable,
            "shared_option": shared_optoin,
            "schedule_id": schedule.schedule_id,
            "title"     : schedule.title,
            "start_time": date_split(str(schedule.start_time)),
            "end_time"  : date_split(str(schedule.end_time)),
            "added_date": date_split(str(schedule.added_date)),
        }
        return response

#スケジュールから月のスケジュールを取得する
@index_bp.route("/get_monthly_schedule", methods=["GET"])
def get_monthly_schedule():
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)
    response = []

    #共有スケジュール
    schedules = db.session.query(SharedSchedule).all()
    month_start = datetime.datetime(year, month, day=1, hour=0, minute=0)
    month_end = datetime.datetime(year, month, day=calendar.monthrange(year, month)[1], hour=23, minute=59, second=59)
    for schedule in schedules:
        start_time_dt = date_split(str(schedule.start_time))
        end_time_dt = date_split(str(schedule.start_time))
        start_time = datetime.datetime(start_time_dt["year"], start_time_dt["month"], start_time_dt["day"], start_time_dt["hour"], start_time_dt["minute"])
        end_time = datetime.datetime(end_time_dt["year"], end_time_dt["month"], end_time_dt["day"], end_time_dt["hour"], end_time_dt["minute"])
        #まるまる入っている、前月をまたぐ、後月をまたぐ、前月・後月をまたぐ
        if (month_start <= start_time and end_time <= month_end) or (start_time < month_start and end_time <= month_end) or (month_start <= start_time and month_end < end_time) or (start_time < month_start and month_end < end_time):
            response.append(create_response(schedule, 1))

    #非共有スケジュール
    schedules = []
    user_id = session["user_id"]
    schedule_all = db.session.query(NoneSharedSchedule).all()
    for schedule in schedule_all:
        decrypted_user_id = cipher_suite.decrypt(schedule.user_id)
        if decrypted_user_id == user_id.encode("utf-8"):
            schedules.append(schedule)
    for schedule in schedules:
        start_time_dt = date_split(str(schedule.start_time))
        end_time_dt = date_split(str(schedule.start_time))
        start_time = datetime.datetime(start_time_dt["year"], start_time_dt["month"], start_time_dt["day"], start_time_dt["hour"], start_time_dt["minute"])
        end_time = datetime.datetime(end_time_dt["year"], end_time_dt["month"], end_time_dt["day"], end_time_dt["hour"], end_time_dt["minute"])
        #まるまる入っている、前月をまたぐ、後月をまたぐ
        if (month_start <= start_time and end_time <= month_end) or (start_time < month_start and end_time <= month_end) or (month_start <= start_time and month_end < end_time):
            response.append(create_response(schedule, 0))
    return jsonify({"response": response})

#スケジュールIDに合致するスケジュールを取得する
@index_bp.route("/get_daily_schedule", methods=["GET"])
def get_daily_schedule():
    schedule_id = request.args.get("schedule_id", type=int)
    shared_option = request.args.get("shared_option", type=int)
    if shared_option:
        schedule = db.session.query(SharedSchedule).filter(SharedSchedule.schedule_id == schedule_id).first()
    else:
        schedule = db.session.query(NoneSharedSchedule).filter(NoneSharedSchedule.schedule_id == schedule_id).first()
    response = create_response(schedule, shared_option)
    return jsonify({"response": response})

#デフォルトのスケジュール(琉大学年歴)を取得
@index_bp.route("/get_default_schedule", methods=["GET"])
def get_default_schedule():
    schedule_row = scraping.extract_schedule()
    schedules = scraping.create_schedule(schedule_row)

    return jsonify({"response": schedules})

@index_bp.route("/", methods=["GET", "POST"])
def index():
    #ユーザーIDがない場合は作成する
    if "user_id" not in session or not session["user_id"]:
        session["user_id"] = str(uuid.uuid4())
        session.permanent = True
    if "extracted" not in session or not session["extracted"] or not session["extracted"]:
        schedule_row = scraping.extract_schedule()
        schedules = scraping.create_schedule(schedule_row)
        for schedule in schedules:
            created_data = create_schedule_data(schedule)
            schedule = SharedSchedule(
                modifiable = 0,
                title = schedule["title"],
                start_time = created_data["start_time_dt"],
                end_time = created_data["end_time_dt"],
                added_date = created_data["added_date_dt"],
            )
            db.session.add(schedule)
        db.session.commit()
        session["extracted"] = 1

    return render_template("index.html")