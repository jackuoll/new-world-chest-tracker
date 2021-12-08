let lastReceivedData = null;
let refreshPaused = false;
let onTab = "stockpiles";


const setTab = (value) => {
    onTab = value;
    const tabs = document.getElementById("tabs");
    refreshAll();
    const children = Array.prototype.slice.call(tabs.children);
    children.forEach((elem) => {
        if(elem.id != value) {
            elem.classList.remove("is-active");
        } else {
            elem.classList.add("is-active");
        }
    });
};

const loadData = () => {
    return fetch("/data/")
        .then((response) => response.json())
        .then((data) => data)
        .catch((err) => {
            if(!refreshPaused) {
                togglePause();
            }
        })
};

const togglePause = () => {
    refreshPaused = !refreshPaused;
    const elem = document.getElementById("pause");
    const cl = elem.classList;
    if(refreshPaused) {
        elem.innerHTML = "<i class='fa fa-play'></i>";
    } else {
        elem.innerHTML = "<i class='fa fa-pause'></i>";
    }
    cl.toggle("has-background-link");
    cl.toggle("has-background-primary");
}

const dropdown = (elemId) => {
    const cl = document.getElementById(elemId).classList;
    cl.toggle("is-active");
};

const showStatistics = (data) => {
    document.getElementById("total-opened").textContent=data["total_opened"];
    document.getElementById("24h-opened").textContent=data["opened_last_24h"];
    document.getElementById("total-opened").textContent=data["total_opened"];
    document.getElementById("nearby").textContent=JSON.stringify(data["nearby"], null, 2);
    document.getElementById("zone").textContent=data["zone"];
};

const showRecentChests = (data) => {
  const recent = document.getElementById("recent-chests");
      let replaceWith = "";
      if(Object.keys(data["reset_timers"][onTab]).length == 0) {
          recent.innerHTML = `<td>All ${onTab} reset!</td>`;
          return;
      }
      for (let [id, info] of Object.entries(data["reset_timers"][onTab])) {
          const fakeApp = false;
          const zone = fakeApp && "z" || info["zone"];
          const name = fakeApp && "name" || info["name"];
          id = fakeApp && "id" || id;
          const reset = info["reset"];
          const resetsIn = info["resets_in"]
          replaceWith += `
            <tr>
              <td>${zone}</td>
              <td>${name}</td>
              <td>${reset}</td>
              <td>${resetsIn}</td>
            </tr>`;
      }
      recent.innerHTML = replaceWith;
};

const refreshAll = () => {
    if(refreshPaused) {
        return;
    }
    loadData().then((data) => {
      if(JSON.stringify(lastReceivedData) == JSON.stringify(data)) {
          return;
      }
      lastReceivedData = data;
      showStatistics(data);
      showRecentChests(data);
    }).catch((err) => {
        if(!refreshPaused) {
            togglePause();
        }
        throw err;
    } );
}

window.onload = function() {
    refreshAll();
};

const repeat = setInterval(refreshAll, 1000);