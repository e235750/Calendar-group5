document.addEventListener("DOMContentLoaded", () => {
    const date = new Date();
    const nowYear = date.getFullYear();
    const nowMonth = date.getMonth() + 1; //リスト番号で返されるため+1する
    const year = document.querySelector("#year");
    const month = document.querySelector("#month")

    year.textContent = nowYear;
    month.textContent = nowMonth;
    setCalendar(nowYear, nowMonth);

    //月遷移
    document.querySelector("#last-month").addEventListener("click", () => {
        let currentYear = document.querySelector("#year").textContent;
        let currentMonth = document.querySelector("#month").textContent;
        currentMonth = Number(currentMonth);
        currentYear = Number(currentYear)
        let lastMonth;
        let lastYear;
        if(currentMonth - 1 == 0) {
            lastMonth = 12
            lastYear = currentYear - 1;
        }
        else {
            lastMonth = currentMonth - 1;
            lastYear = currentYear;
        }

        const calendar = document.querySelector(".calendar");
        while(calendar.firstChild) {
            calendar.removeChild(calendar.firstChild);
        }
        document.querySelector("#year").textContent = lastYear;
        document.querySelector("#month").textContent = lastMonth;
        setCalendar(lastYear, lastMonth)
    });
    document.querySelector("#today").addEventListener("click", () => {
        const date = new Date();
        const nowYear = date.getFullYear();
        const nowMonth = date.getMonth() + 1;
        const year = document.querySelector("#year");
        const month = document.querySelector("#month")

        year.textContent = nowYear;
        month.textContent = nowMonth;
        setCalendar(nowYear, nowMonth);
    });
    document.querySelector("#next-month").addEventListener("click", () => {
        let currentYear = document.querySelector("#year").textContent;
        let currentMonth = document.querySelector("#month").textContent;
        currentMonth = Number(currentMonth);
        currentYear = Number(currentYear)
        let nextMonth;
        let nextYear;
        if(currentMonth + 1 == 13) {
            nextMonth = 1
            nextYear = currentYear + 1;
        }
        else {
            nextMonth = currentMonth + 1;
            nextYear = currentYear;
        }

        const calendar = document.querySelector(".calendar");
        while(calendar.firstChild) {
            calendar.removeChild(calendar.firstChild);
        }
        document.querySelector("#year").textContent = nextYear;
        document.querySelector("#month").textContent = nextMonth;
        setCalendar(nextYear, nextMonth)
    });
});

//カレンダーセット
function setCalendar(year, month) {
    fetch(`/get_calendar?year=${year}&month=${month}`)
    .then(response => response.json())
    .then(data => {
        const calendarTable = document.querySelector(".calendar");
        calendarTable.innerHTML = data.html;

        document.querySelectorAll(".exi").forEach((elm) => {
            elm.addEventListener("click", setAddForm);
        });

        return getMonthlySharedSchedule(year, month);
    })
    .then(scheduleData => {
        // scheduleData.forEach((elm) => {
        //     const datetime = elm.start_time
        //     const startDay = Number(datetime["day"]);
        //     const td = document.querySelector(`#td-${day}`);
        //     const ul = td.querySelector("ul");
        //     const li = document.createElement("li");
        //     li.classList.add("shared");
        //     let titleText = elm.title;
        //     if(titleText.length > 6) {
        //         titleText = titleText.slice(0,6);
        //         titleText += "...";
        //     }
        //     li.textContent = titleText;
        //     ul.appendChild(li);
        // })
        console.log(scheduleData);
    })
    .catch(error => {
        console.error("Error", error)
    });
}

//追加フォームセット
function setAddForm(event) {
    let curX = event.pageX;
    let curY = event.pageY;
    const margin = 25;

    getMonthlySharedSchedule(2024, 7)

    fetch("/get_add_form")
    .then(response => response.json())
    .then(data => {
        //フォームがでている間は日付のクリックイベントを無効にする
        document.querySelectorAll(".exi").forEach((elm) => {
            elm.style.pointerEvents = "none";
        });
        if(document.querySelector(".add-form")) document.querySelector(".add-form").remove();
        
        let parser = new DOMParser();
        let doc = parser.parseFromString(data.html, "text/html");
        let addForm = doc.body.firstChild;
        document.body.insertAdjacentElement("afterbegin", addForm);
        const form =  document.querySelector(".add-form")

        form.querySelector("#title").focus();
        //フォームが画面外に出ないようにする
        if(curX < form.clientWidth+margin) {
            curX += margin;
        }
        else {
            curX -= form.clientWidth + margin;
        }
        //フォームの位置
        curY -= form.clientHeight/2;
        form.style.top = `${curY}px`;
        form.style.left = `${curX}px`;

        //キャンセル時のフォーム消去 
        form.querySelector("#cancel").addEventListener("click", () => {
            form.remove();
            document.querySelectorAll(".exi").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
        });
        form.querySelector("#back").addEventListener("click", () => {
            form.remove();
            document.querySelectorAll(".exi").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
        });

        //フォーム以外をクリックしたらフォームを削除する
        document.addEventListener("click", (event) => {
            if(document.querySelector(".add-form") != null) {
                let currElm = event.target;
                let isForm = false;
                while(currElm != null) {
                    if(currElm.className === "add-form") {
                        isForm = true;
                        break;
                    }
                    currElm = currElm.parentNode;
                }
                if(!isForm) {
                    document.querySelector(".add-form").remove();
                    document.querySelectorAll(".exi").forEach((elm) => {
                        elm.style.pointerEvents = "auto";
                    });
                }
            }
        });

        const start = document.querySelector("#start");
        const end = document.querySelector("#end");

        //start(end)よりも後(前)の日時を設定できないようにする
        start.addEventListener("change", () => {
            const startDate = new Date(start.value);

            if(!isNaN(startDate.getTime())) {
                end.min = start.value;
            }
        })
        end.addEventListener("change", () => {
            const endDate = new Date(end.value);

            if(!isNaN(endDate.getTime())) {
                start.max = end.value;
            }
        })

        dragAndDrop();

        const add = document.querySelector("#add");
        add.addEventListener("click", () => {
            const title = document.querySelector("#title");
            const date = new Date();
            let caution = false;
            
            //タイトルの長さ検証
            if(title.value.length === 0) {
                document.querySelector("#title-caution").style.display = "block";
                caution = true;
            }
            else {
                document.querySelector("#title-caution").style.display = "none";
            }
            if(title.value.length > 100) {
                document.querySelector("#length-caution").style.display = "block";
                const slicedStr = title.value.slice(0, 100);
                title.value = slicedStr;
                caution = true;
            }
            else {
                document.querySelector("#length-caution").style.display = "none";
            }
            //期間設定の有無を検証
            if(checkPeriod(start.value) && checkPeriod(end.value)) {
                document.querySelector("#period-caution").style.display = "none";
            }
            else {
                document.querySelector("#period-caution").style.display = "block";
                caution = true; 
            }
            if(caution) return;
            
            const titleText = title.value;
            periodS = splitDateTime(start.value);
            periodE = splitDateTime(end.value);
            let sharedOption
            //共有設定取得
            form.querySelectorAll(".shared-options").forEach((elm) => {
                if(elm.checked) {
                    sharedOption = elm.value;
                }
            })
            
            const scheduleData = {
                "title": titleText,
                "start_time": periodS,
                "end_time": periodE,
                "added_date": {
                                "year": date.getFullYear(),
                                "month": date.getMonth() + 1,
                                "day":  date.getDate(),
                                "hour": date.getHours(),
                                "minute": date.getMinutes(),
                            },
            }
            postScheduleData(scheduleData, Number(sharedOption))
            form.remove()
            document.querySelectorAll(".exi").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
        });
    })
    .catch(error => {
        console.error("Error", error)
    });
}

//スケジュールデータの送信
function postScheduleData(data, shared) {
    let url;
    if(shared) url = "/set_shared_schedule";
    else url = "/set_none_shared_schedule";

    const options = {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(data),
    };

    fetch(url, options)
    .then(response => {
        if(!response.ok) {
            throw new Error("Error", response.statusText)
        }
        return response.json
    })
    .then(data => {
        console.log("Success", data)
    })
    .catch(error => {
        console.error("Error", error);
    })
}

//指定年月の共有スケジュール情報を取得
function getMonthlySharedSchedule(year, month) {
    return fetch(`/get_monthly_shared_schedule?year=${year}&month=${month}`)
    .then(response => response.json())
    .then(data => {
        return data.response
    })
    .catch(error => {
        console.error("Error", error)
        throw error
    });
}

//フォームのドラッグ&ドロップを可能にする
function dragAndDrop() {
    const tab = document.querySelector(".drag-and-drop");
    tab.addEventListener("mousedown", mdown, false);

    let x, y;

    function mdown(e) {
        const form = document.querySelector(".add-form");
        form.classList.add("drag");

        // マウスの位置とフォームの位置の差分を計算
        x = e.clientX - form.offsetLeft;
        y = e.clientY - form.offsetTop;

        document.body.addEventListener("mousemove", mmove, false);
        document.body.addEventListener("mouseup", mup, false);
    }

    function mmove(e) {
        const drag = document.querySelector(".drag");
        const form = document.querySelector(".add-form");

        e.preventDefault();

        // マウスの移動に合わせてフォームを移動
        let Y = e.clientY - y;
        let X = e.clientX - x;
        if(X < 0) X = 0;
        if(X + form.clientWidth > document.body.clientWidth) X = document.body.clientWidth - form.clientWidth;
        if(Y < 0) Y = 0;
        if(Y + form.clientHeight> document.body.clientHeight) Y = document.body.clientHeight - form.clientHeight;
        drag.style.top = Y + "px";
        drag.style.left = X + "px";
    }

    function mup() {
        const drag = document.querySelector(".drag");

        document.body.removeEventListener("mousemove", mmove, false);
        document.body.removeEventListener("mouseup", mup, false);

        drag.classList.remove("drag");
    }
}

//引数はYY-MM-DDThh:mm形式
function splitDateTime(dateTime) {
    const [date, time] = dateTime.split("T");
    const [year, month, day] = date.split("-");
    const [hour, minute] = time.split(":");

    return {"year": year, "month": month, "day": day, "hour": hour, "minute": minute};
}
function checkPeriod(period) {
    const reg = new RegExp("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}");
    if(period == "" || reg.test(period) == -1) return false;
    return true;
}

