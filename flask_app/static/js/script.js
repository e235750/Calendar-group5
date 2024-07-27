//画面読み込み時の処理
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
    return fetch(`/get_calendar?year=${year}&month=${month}`)
    .then(response => response.json())
    .then(data => {
        const calendarTable = document.querySelector(".calendar");
        calendarTable.innerHTML = data.html;

        document.querySelectorAll(".add").forEach((elm) => {
            elm.addEventListener("click", setAddForm);
        });

        return getMonthlySchedule(year, month);
    })
    .then(scheduleData => {
        //スケジュールがあるなら表示する
        scheduleData.forEach((elm) => {
            const startTimeDt = elm["start_time"];
            const endTimeDt = elm["end_time"];
            const startTime = new Date(startTimeDt["year"], startTimeDt["month"]-1, startTimeDt["day"], startTimeDt["hour"], startTimeDt["minute"]);
            const endTime = new Date(endTimeDt["year"], endTimeDt["month"]-1, endTimeDt["day"], endTimeDt["hour"], endTimeDt["minute"]);
            const monthStart = new Date(year, month-1, 1, 0, 0);
            const monthEnd = new Date(year, month, 0, 23, 59, 59)
            //スケジュールをリストに追加
            function appendShedule(elm, day) {
                const td = document.querySelector(`#td-${day}`);
                const ul = td.querySelector("ul");
                if(ul.childElementCount < 3) {
                    const li = document.createElement("li");
                    li.classList.add("schedule");
                    if(elm["shared_option"]) {
                        li.classList.add("shared");
                        li.value = 1;
                    }
                    else {
                        li.classList.add("none-shared");
                        li.value = 0;
                    }
                    li.id = elm["schedule_id"];
                    let titleText = elm.title;
                    if(titleText.length > 6) {
                        titleText = titleText.slice(0,6);
                        titleText += "...";
                    }
                    li.textContent = titleText;
                    ul.appendChild(li);

                    li.addEventListener("click", (event) => {setDetail(event)})
                }
            }
            //まるまる入っている
            if((monthStart <= startTime && endTime <= monthEnd) && (startTimeDt["year"] == year && startTimeDt["month"] == month) && (endTimeDt["year"] == year && endTimeDt["month"] == month)) {
                for(let day = startTimeDt["day"]; day <= endTimeDt["day"]; day ++) {
                    appendShedule(elm, day);
                }
            }
            //前月をまたぐ
            else if((startTime < monthStart && endTime <= monthEnd) && (endTimeDt["year"] == year && endTimeDt["month"] == month)) {
                for(let day = 1; day <= endTimeDt["day"]; day ++) {
                    appendShedule(elm, day);
                }
            }
            //後月をまたぐ
            else if((monthStart <= startTime && monthEnd < endTime) && (startTimeDt["year"] == year && startTimeDt["month"] == month)) {
                for(let day = startTimeDt["day"]; day <= monthEnd.getDate(); day ++) {
                    appendShedule(elm, day)
                }
            }
        })
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

    fetch("/get_add_form")
    .then(response => response.json())
    .then(data => {
        //フォームがでている間は日付のクリックイベントを無効にする
        document.querySelectorAll(".add").forEach((elm) => {
            elm.style.pointerEvents = "none";
        });
        //フォームがでている間は詳細のクリックイベントを無効にする
        document.querySelectorAll(".schedule").forEach((elm) => {
            elm.style.pointerEvents = "none";
        });
        if(document.querySelector(".add-form")) document.querySelector(".add-form").remove();
        
        let parser = new DOMParser();
        let doc = parser.parseFromString(data.html, "text/html");
        let addForm = doc.body.firstChild;
        document.body.insertAdjacentElement("afterbegin", addForm);
        const form =  document.querySelector(".add-form")
        const tab = document.querySelector(".tab");
        const add = document.querySelector("#add");
        let sharedOption = 1;
        //共有設定取得
        form.querySelectorAll(".shared-options").forEach((elm) => {
            elm.addEventListener("change", (event) => {
                sharedOption = Number(event.target.value);
                if(sharedOption) {
                    tab.classList.remove("none-shared");
                    tab.classList.add("shared");
                    add.classList.remove("none-shared")
                    add.classList.add("shared")
                }
                else {
                    tab.classList.remove("shared");
                    tab.classList.add("none-shared");
                    add.classList.remove("shared")
                    add.classList.add("none-shared")
                }
            })
        })
        
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
            document.querySelectorAll(".add").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
            document.querySelectorAll(".schedule").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
        });
        form.querySelector("#back").addEventListener("click", () => {
            form.remove();
            document.querySelectorAll(".add").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
            document.querySelectorAll(".schedule").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
        });

        // ドラッグしたら追加フォームが消えるバグのためコメントアウト
        // //フォーム以外をクリックしたらフォームを削除する
        // document.addEventListener("click", (event) => {
        //     if(document.querySelector(".add-form") != null) {
        //         let currElm = event.target;
        //         let isForm = false;
        //         while(currElm != null) {
        //             if(currElm.className === "add-form") {
        //                 isForm = true;
        //                 break;
        //             }
        //             currElm = currElm.parentNode;
        //         }
        //         if (!isForm) {
        //             document.querySelector(".add-form").remove();
        //             document.querySelectorAll(".add").forEach((elm) => {
        //                 elm.style.pointerEvents = "auto";
        //             });
        //         }

        //     }
        // });

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
            postScheduleData(scheduleData, sharedOption)
            form.remove()
            document.querySelectorAll(".add").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
            year = document.querySelector("#year").textContent;
            month = document.querySelector("#month").textContent;
            return setCalendar(Number(year), Number(month))
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
        return response.json();
    })
    .then(data => {
        console.log("Success", data.response)
    })
    .catch(error => {
        console.error("Error", error);
    })
}

//指定年月の共有スケジュール情報を取得
function getMonthlySchedule(year, month) {
    return fetch(`/get_monthly_schedule?year=${year}&month=${month}`)
    .then(response => response.json())
    .then(data => {
        return data.response
    })
    .catch(error => {
        console.error("Error", error)
        throw error
    });
}

//詳細セット
function setDetail(event) {
    let curX = event.pageX;
    let curY = event.pageY;
    const margin = 35;

    fetch("/get_detail")
    .then(response => response.json())
    .then(data => {
        //詳細がでている間は他の詳細のクリックイベントを無効にする
        document.querySelectorAll(".schedule").forEach((elm) => {
            elm.style.pointerEvents = "none";
        });
        //詳細がでている間は追加のクリックイベントを無効にする
        document.querySelectorAll(".add").forEach((elm) => {
            elm.style.pointerEvents = "none";
        });
        if(document.querySelector(".detail")) document.querySelector(".detail").remove();

        let parser = new DOMParser();
        let doc = parser.parseFromString(data.html, "text/html");
        let detailHTML = doc.body.firstChild;
        document.body.insertAdjacentElement("afterbegin", detailHTML);
        const detail =  document.querySelector(".detail")

        //詳細が画面外に出ないようにする
        if(curX < detail.clientWidth+margin) {
            curX += margin;
        }
        else {
            curX -= detail.clientWidth + margin;
        }
        //詳細の位置
        curY -= detail.clientHeight/2;
        detail.style.top = `${curY}px`;
        detail.style.left = `${curX}px`;

        //キャンセル時の詳細消去 
        detail.querySelector("#detail-back").addEventListener("click", () => {
            detail.remove();
            document.querySelectorAll(".schedule").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
            document.querySelectorAll(".add").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
        });

        const detailDelete = detail.querySelector("#delete")
        detailDelete.addEventListener("click", () => {
            deleteSchedule(event.target.id, event.target.value);
            detail.remove();
            document.querySelectorAll(".schedule").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
            document.querySelectorAll(".add").forEach((elm) => {
                elm.style.pointerEvents = "auto";
            });
            year = document.querySelector("#year").textContent;
            month = document.querySelector("#month").textContent;
            return setCalendar(Number(year), Number(month))
        })

        // ドラッグしたら詳細が消えるバグのためコメントアウト
        // //詳細以外をクリックしたらフォームを削除する
        // document.addEventListener("click", (event) => {
        //     if(document.querySelector(".detail") != null) {
        //         let currElm = event.target;
        //         let isDetail = false;
        //         while(currElm != null) {
        //             if(currElm.className === "detail") {
        //                 isDetail = true;
        //                 break;
        //             }
        //             currElm = currElm.parentNode;
        //         }
        //         if(!isDetail) {
        //             document.querySelector(".detail").remove();
        //             document.querySelectorAll(".schedule").forEach((elm) => {
        //                 elm.style.pointerEvents = "auto";
        //             });
        //         }
        //     }
        // });
        dragAndDrop();
        return getDailySchedule(event.target.id, event.target.value)
    })
    .then(scheduleData => {
        const detail = document.querySelector(".detail");
        const title = detail.querySelector("#detail-data");
        const periodS = detail.querySelector("#detail-start");
        const periodE = detail.querySelector("#detail-end");
        const addedTime = detail.querySelector("#added-time")

        const sharedOption = scheduleData["shared_option"]

        //共有、非共有クラス設定
        if(sharedOption) {
            detail.querySelector(".tab").classList.remove("none-shared");
            detail.querySelector("#dot-title").classList.remove("none-shared");
            detail.querySelector("#dot-period").classList.remove("none-shared");
            detail.querySelector("#delete").classList.remove("none-shared");
            detail.querySelector(".tab").classList.add("shared");
            detail.querySelector("#dot-title").classList.add("shared");
            detail.querySelector("#dot-period").classList.add("shared");
            detail.querySelector("#delete").classList.add("shared");
        }
        else {
            detail.querySelector(".tab").classList.remove("shared");
            detail.querySelector("#dot-title").classList.remove("shared");
            detail.querySelector("#dot-period").classList.remove("shared");
            detail.querySelector("#delete").classList.remove("shared");
            detail.querySelector(".tab").classList.add("none-shared");
            detail.querySelector("#dot-title").classList.add("none-shared");
            detail.querySelector("#dot-period").classList.add("none-shared");
            detail.querySelector("#delete").classList.add("none-shared");
        }
        title.value = scheduleData["title"]
        //期間、追加日設定
        {
            periodS.querySelector("#detail-year").textContent = String(scheduleData["start_time"]["year"]);
            periodS.querySelector("#detail-month").textContent = String(scheduleData["start_time"]["month"]).padStart(2, '0');
            periodS.querySelector("#detail-day").textContent = String(scheduleData["start_time"]["day"]).padStart(2, '0');
            periodS.querySelector("#detail-hour").textContent = String(scheduleData["start_time"]["hour"]).padStart(2, '0');
            periodS.querySelector("#detail-minute").textContent = String(scheduleData["start_time"]["minute"]).padStart(2, '0');
            periodE.querySelector("#detail-year").textContent = String(scheduleData["end_time"]["year"]);
            periodE.querySelector("#detail-month").textContent = String(scheduleData["end_time"]["month"]).padStart(2, '0');
            periodE.querySelector("#detail-day").textContent = String(scheduleData["end_time"]["day"]).padStart(2, '0');
            periodE.querySelector("#detail-hour").textContent = String(scheduleData["end_time"]["hour"]).padStart(2, '0');
            periodE.querySelector("#detail-minute").textContent = String(scheduleData["end_time"]["minute"]).padStart(2, '0');
            addedTime.querySelector("#added-year").textContent = String(scheduleData["added_date"]["year"]);
            addedTime.querySelector("#added-month").textContent = String(scheduleData["added_date"]["month"]).padStart(2, '0');
            addedTime.querySelector("#added-day").textContent = String(scheduleData["added_date"]["day"]).padStart(2, '0');
            addedTime.querySelector("#added-hour").textContent = String(scheduleData["added_date"]["hour"]).padStart(2, '0');
            addedTime.querySelector("#added-minute").textContent = String(scheduleData["added_date"]["minute"]).padStart(2, '0');
        }
    })
}

function getDailySchedule(scheduleID, sharedOption) {
    return fetch(`/get_daily_schedule?schedule_id=${scheduleID}&shared_option=${sharedOption}`)
    .then(response => response.json())
    .then(data => {
        return data.response;
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
        const form = document.querySelector(".show");
        form.classList.add("drag");

        // マウスの位置とフォームの位置の差分を計算
        x = e.clientX - form.offsetLeft;
        y = e.clientY - form.offsetTop;

        document.body.addEventListener("mousemove", mmove, false);
        document.body.addEventListener("mouseup", mup, false);
    }

    function mmove(e) {
        const drag = document.querySelector(".drag");
        const form = document.querySelector(".show");

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

//スケジュールIDに合致するスケジュールの削除
function deleteSchedule(scheduleID, sharedOption) {
    fetch(`/delete_schedule?schedule_id=${scheduleID}&shared_option=${sharedOption}`)
    .then(response => response.json())
    .then(data => {
        console.log("Success", data.response)
    })
    .catch(error => {
        console.error("Error", error);
    })
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