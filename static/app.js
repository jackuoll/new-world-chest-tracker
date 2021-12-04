let lastReceivedData = null;
let refreshPaused = false;

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

const refreshStats = () => {
    if(refreshPaused) {
        return;
    }
    loadData().then((data) => {
      if(JSON.stringify(lastReceivedData) == JSON.stringify(data)) {
          return;
      }
      lastReceivedData = data;
      document.getElementById("total-opened").textContent=data["total_opened"];
      document.getElementById("24h-opened").textContent=data["opened_last_24h"];
      const recent = document.getElementById("recent-chests");
      let replaceWith = "";
      for (let [id, info] of Object.entries(data["reset_timers"])) {
          const fakeApp = false;
          const zone = fakeApp && "z" || info["zone"];
          const name = fakeApp && "name" || info["name"];
          id = fakeApp && "id" || id;
          const reset = info["reset"];
          const resetsIn = info["resets_in"]
          const dropdownContent = `
                     <a href="#" class="dropdown-item">
                        x
                      </a>
                      <a class="dropdown-item">
                        y
                      </a>
                      <a href="#" class="dropdown-item">
                        z
                      </a>
                      <a href="#" class="dropdown-item">
                        m
                      </a>
                      <hr class="dropdown-divider">
                      <a href="#" class="dropdown-item">
                        ${id}
                      </a>
          `;
          replaceWith += `
            <td>
                <div class="dropdown" onclick="dropdown('${id}-{name}')" id="${id}-{name}">
                  <div class="dropdown-trigger">
                    <div class="is-small" aria-haspopup="true" aria-controls="dropdown-menu">
                      <span>${zone}</span>
                    </div>
                  </div>
                  <div class="dropdown-menu" id="dropdown-menu" role="menu">
                    <div class="dropdown-content">
                        ${dropdownContent}
                    </div>
                  </div>
                </div>
            </td>
                 <td>${name}</td><td>${reset}</td><td>${resetsIn}</td>
            </tr>`;
      }
      recent.innerHTML = replaceWith;
      document.getElementById("total-opened").textContent=data["total_opened"];
      document.getElementById("nearby").textContent=JSON.stringify(data["nearby"], null, 2);
    }).catch((err) => {
        if(!refreshPaused) {
            togglePause();
        }
        throw err;
    } );
}

window.onload = function() {
    refreshStats();
};

const repeat = setInterval(refreshStats, 1000);