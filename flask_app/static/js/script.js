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

function setCalendar(year, month) {
    fetch(`/get_calendar?year=${year}&month=${month}`)
    .then(response => response.json())
    .then(data => {
        const calendarTable = document.querySelector(".calendar");
        calendarTable.innerHTML = data.html;

        document.querySelectorAll(".exi").forEach((elm) => {
            elm.addEventListener("click", createAddForm);
        });
        // calendarTable.innerHTML = `
        //     <tr>
        //         <th>日</th>
        //         <th>月</th>
        //         <th>火</th>
        //         <th>水</th>
        //         <th>木</th>
        //         <th>金</th>
        //         <th>土</th>
        //     </tr>`;
        // // Insert the new calendar rows
        // calendarTable.insertAdjacentHTML("beforeend", data.html);
    })
    .catch(error => {
        console.error("Error", error)
    });
}

function createAddForm(event) {
    let curX = event.pageX;
    let curY = event.pageY;
    const margin = 25;

    fetch("/get_add_form")
    .then(response => response.json())
    .then(data => {
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
        })
        form.querySelector("#back").addEventListener("click", () => {
            form.remove();
        })

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
                }
            }
        })
    })
    .catch(error => {
        console.error("Error", error)
    });
}