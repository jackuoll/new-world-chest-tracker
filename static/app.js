let lastReceivedData = null;
let refreshPaused = false;
let onTab = "stockpiles";
let repositionButtonEnabled = false;
let currentPosition = null;


const canResposition = (value) => {
    repositionButtonEnabled = value;
};


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

const setLocation = (id) => {
    return fetch(`/set_marker_location/${id}/`, {method: "PATCH"})
        .then((response) => response.json())
        .then((data) => data)
        .catch((err) => {
            if(!refreshPaused) {
                togglePause();
            }
        })
};

const showStatistics = (data) => {
    currentPosition = JSON.parse(data["current_position"]);
    document.getElementById("total-opened").textContent=data["total_opened"];
    document.getElementById("elite-chests-opened").textContent=data["elite_chests_opened"];
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
          const zone = info["zone"];
          const resetTimestamp = info["reset"];
          const reset = moment.unix(resetTimestamp).format("h:mmA").toLowerCase();
          const resetsIn = info["resets_in"]
          let repos = "";
          let locationName = info["name"];
          if(repositionButtonEnabled) {
              repos = `<a onClick='setLocation("${id}");'><i class="fa-solid fa-location-crosshairs"></i></a>`;
              locationName = `<input type="text" value="${locationName}" class="hidden-input"></input>`;
          }
          replaceWith += `
            <tr data-marker-id="${id}">
              <td>${repos} ${zone}</td>
              <td>${locationName}</td>
              <td>${reset}</td>
              <td>${resetsIn}</td>
            </tr>`;
      }
      recent.innerHTML = replaceWith;
      const hiddenInputs = document.getElementsByClassName("hidden-input");
      for (let i = 0; i < hiddenInputs.length; i++) {
          const input = hiddenInputs[i];
          input.addEventListener('focusin', (event) => {
              refreshPaused = true;
          });
          input.addEventListener('keypress', (event) => {
              if(event.key == "Enter") {
                  input.blur();
              }
          });
          input.addEventListener('focusout', (event) => {
            refreshPaused = false;
            const tr = input.closest("tr")
            const markerId = tr.dataset.markerId;
            fetch(`/set_marker_name/${markerId}/`, {
                method: "PATCH",
                body: JSON.stringify({"new_name": input.value}),
                headers: {"Content-Type": "application/json"},
            })
                .then((response) => response.json())
                .catch((err) => {
                    if(!refreshPaused) {
                        togglePause();
                    }
                })
          });
      }


};

const refreshAll = () => {
    if(refreshPaused) {
        return;
    }
    loadData().then((data) => {
      // todo: doesn't work anymore since we send seconds remaining from python
      if(JSON.stringify(lastReceivedData) == JSON.stringify(data) || refreshPaused) {
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

const displayAddMarkerForm = () => {
    const submit = () => {
        const t = document.getElementById("form_type").value;
        const submitValues = {
            name: document.getElementById("form_name").value || t,
            zone: document.getElementById("form_zone").value,
            type: t,
            is_elite: t.includes("Elite"),
            location_x: document.getElementById("form_x").value,
            location_y: document.getElementById("form_y").value,
        }
        console.log(submitValues);
        fetch(`/add_marker/`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(submitValues)
        })
            .then((response) => {
                if(response.ok) {
                    return response.json();
                } else if(response.status == 401) {
                    const message = new Notification(NotificationLevel.danger, "You are not authorized to create markers.");
                    Notifications.displayNotificationNow(message);
                } else {
                    const message = new Notification(NotificationLevel.danger, "Whoops... something went wrong.");
                    Notifications.displayNotificationNow(message);
                }
            })
            .then(() => {
                const message = new Notification(NotificationLevel.info, "Marker created.");
                Notifications.displayNotificationNow(message);
            })
            .catch((err) => {
                throw err;
            }).finally(() => {removeModal();})
    };
    fetch(
        `/add_marker_form/`,
        {
            "headers": {"Content-Type": "text/html"},
            "method": "GET",
        },
    )
    .then(response => {
        return response.text();
    })
    .then(data => {
        createModal({
            title: "Add Marker",
            content: data,
            buttons: {
                "Submit": {callback: submit, classes: "is-link"},
                "Cancel": {callback: removeModal}
            },
            height: 450
        })
    })
    .catch((error) => {
        createModal({
            title: "Error occurred!",
            content: "Something went wrong"
        })
    });
};

const deleteMarkerPrompt = (marker_id) => {
    const map = MAP_REFERENCE;
    if(!map) {
        alert("Map not initialised");
        return;
    }
    let name = null;
    map.markers.forEach((marker) => {
        if(marker.marker_id === marker_id) {
            name = marker.name;
        }
    })
    if(!name) {
        alert("Marker not found");
        return;
    }
    const deleteMarker = () => {
        console.log("??");
        fetch(`/delete_marker/${marker_id}/`, {
            method: "DELETE",
        }).then(response => {
            console.log(response);
            if(!response.ok) {
                const message = new Notification(NotificationLevel.danger, "Couldn't delete marker.");
                Notifications.displayNotificationNow(message);
                return;
            }
            const message = new Notification(NotificationLevel.info, "Marker deleted.");
            Notifications.displayNotificationNow(message);
        }).catch((err) => {
            const message = new Notification(NotificationLevel.info, "Couldn't delete marker.");
            Notifications.displayNotificationNow(message);
        }).finally(() => {
            removeModal();
        })
    };
    removeModal();
    createModal({
        title: `Delete Marker ${name}?`,
        content: `You are about to delete the marker ${name}. Are you sure?`,
        buttons: {
            "Confirm": {callback: deleteMarker, classes: "is-danger"},
            "Cancel": {callback: removeModal}
        },
        height: 450
    })
}

window.onload = function() {
    refreshAll();
};

const repeat = setInterval(refreshAll, 1000);
