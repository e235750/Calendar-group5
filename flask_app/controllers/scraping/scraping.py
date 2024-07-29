import requests
from bs4 import BeautifulSoup
import datetime
import re

#スケジュールの抽出
def extract_schedule():
    res = requests.get("https://www.u-ryukyu.ac.jp/aboutus/calendar/")
    soup = BeautifulSoup(res.text, "html.parser")

    reg1 = re.compile(r'\d\d*月\d\d*日（.）')
    reg2 = re.compile(r'\d\d*月\d\d*日（.）～\d\d*月\d\d*日（.）')

    tr_list = soup.find_all("tr")
    #[year, period, title]
    list_one_day = []
    list_time_limited = []
    year = datetime.datetime.now().year
    #スケジュールの期間と内容の取得
    for tr in tr_list:
        #スケジュール年取得
        if tr.find("th") != None:
            year = tr.find("th").get_text()[0:-1]
        #スケジュール内容取得
        elif tr.find_all("td") != None:
            td_content = tr.find_all("td")
            if reg2.match(td_content[0].get_text()):
                list_time_limited.append([year] + [td.get_text() for td in td_content])
            elif reg1.match(td_content[0].get_text()):
                list_one_day.append([year] + [td.get_text() for td in td_content])
    
    return [list_one_day, list_time_limited]

def create_schedule(list):
    reg_date = re.compile(r'\d\d*')
    schedules = []
    #1日で終わる予定
    for item in list[0]:
        period = item[1]
        month_and_day = re.findall(reg_date, period)
        date = {
            "shared_option": 1,
            "modifiable": 0,
            "title": item[2],
            "start_time": {"year": str(item[0]), "month": str(month_and_day[0]), "day": str(month_and_day[1]), "hour": str(0), "minute": str(0)},
            "end_time": {"year": str(item[0]), "month": str(month_and_day[0]), "day": str(month_and_day[1]), "hour": str(23), "minute": str(59)},
            "added_date": {"year": str(item[0]), "month": str(month_and_day[0]), "day": str(month_and_day[1]), "hour": str(0), "minute": str(0)},
        }
        schedules.append(date)

    #期間がある予定
    for item in list[1]:
        period = item[1]
        month_and_day = re.findall(reg_date, period)
        date = {
            "shared_option": 1,
            "modifiable": 0,
            "title": item[2],
            "start_time": {"year": str(item[0]), "month": str(month_and_day[0]), "day": str(month_and_day[1]), "hour": str(0), "minute": str(0)},
            "end_time": {"year": str(item[0]), "month": str(month_and_day[2]), "day": str(month_and_day[3]), "hour": str(23), "minute": str(59)},
            "added_date": {"year": str(item[0]), "month": str(month_and_day[0]), "day": str(month_and_day[1]), "hour": str(0), "minute": str(0)},
        }
        schedules.append(date)
    
    return schedules