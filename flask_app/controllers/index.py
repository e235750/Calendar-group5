from flask import Blueprint, render_template, request, redirect, Markup, jsonify
import calendar
import datetime

index_bp = Blueprint('index', __name__, url_prefix='/')

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
        if day % 7 == 0:
            html += "<tr class='date-row'>"
        if month_data["first_day"] == 6:
            if day+1 <= month_data["month_range"]:
                html += f"<td id=td-{day - month_data['first_day']} class='exi'><div class='date-num'>{day+1}</div></td>"
            else:
                html += "<td></td>"
        else:
            if day > month_data["first_day"] and day - month_data["first_day"] <= month_data["month_range"]:
                html += f"<td id=td-{day - month_data['first_day']} class='exi'><div class='date-num'>{day - month_data['first_day']}</div></td>"
            else:
                html += "<td></td>"

        if day % 7 == 6:
            html += "</tr>"

    return {"html": html}


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
                    <input type="radio" id="shared" name="shared-options" value="shared" checked/>
                    <label for="shared">共有</label>
                    </div>
                    <div id="none-shared-option">
                    <input type="radio" id="none-shared" name="shared-options" value="none-shared"/>
                    <label for="none-shared">非共有</label>
                    </div>
                </div>
                <div id="select">
                    <div id="cancel">キャンセル</div>
                    <div id="add">追加</div>
                </div>
            </div>
            """
    return jsonify({"html": html})

@index_bp.route("/get_calendar", methods=["GET"])
def get_calendar():
    year = request.args.get("year", type=int, default=datetime.datetime.now().year)
    month = request.args.get("month", type=int, default=datetime.datetime.now().month)
    calendar_data = create_calendar(year, month)
    return jsonify(calendar_data)

@index_bp.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")