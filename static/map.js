let MAP_REFERENCE = null;
const SCALE = 0.9;
const NUM_BLOCKS_WIDTH = 3;

class MapMarker {
    constructor(map, marker_id, name, x, y, t, scale) {
        this.name = name;
        this.map = map;
        this.marker_id = marker_id;
        this.x = x;
        this.y = y;
        this.type = t;
        this.scale = scale;
        this.image = this.loadImage(this.map.addMarkerImage);
    }

    loadImage(callback) {
        const map = this.map;
        const image = new Image();
        image.src = `/static/images/${this.type}.png`;
        image.onload = () => {
            map.addMarkerImage(this);
        }
        return image;
    }
}

class MapSection {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get blockIndex () {
        const imgX = Math.floor(this.x / 256);
        const imgY = Math.floor(this.y / 256) + 1;
        if(imgX > 55 || imgX < 0 || imgY > 56 || imgY < 0) {
            return null;
        }
        return [imgX, imgY];
    }

    get realXStart() {
        return this.blockIndex[0] * 256;
    }

    get realYStart() {
        return this.blockIndex[1] * 256;
    }

    get xImageUrl() {
        return this.blockIndex[0];
    }

    get yImageUrl() {
        return this.blockIndex[1];
    }

    get canvasXLocation(){
        return this.xImageUrl * 256;
    }

    get canvasYLocation(){
        return Math.abs(56 - this.yImageUrl) * 256;
    }

    get imageUrl() {
        if(this.blockIndex == null) {
            return null;
        }
        return `/static/map_images/${this.xImageUrl}_${this.yImageUrl}.png`;
    }
}

class Map {
    constructor(canvas, x_center, y_center, size=256) {
        this.x_center = x_center;
        this.y_center = y_center;
        this.numBlocksWidth = NUM_BLOCKS_WIDTH;
        this.blocks = this.getMapBlocks();
        this.markersReq = this.markersRequest();
        this.scale = SCALE;
        this.canvas = canvas;
        this.canvas.width = 256 * this.numBlocksWidth * this.scale;
        this.canvas.height = 256 * this.numBlocksWidth * this.scale;
        this.ctx = canvas.getContext("2d");
        this.ctx.scale(this.scale, this.scale);
        this.markers = [];
        this.draw();
        this.initContextMenu();
        // this.addTreasure(100, 100);
    }

    canvasYLocation(y) {
        return Math.abs(256 * 56 - y);
    }

    get mapBounds() {
        return {
            minX: this.minX,
            minY: 256 * 56 - this.minY,
            width: 256 * this.numBlocksWidth,
            height: 256 * this.numBlocksWidth,
        }
    }

    initContextMenu() {
        const map = this;
        document.getElementById("canvas").addEventListener("contextmenu", (e) => {
            e.preventDefault()
        });
        this.canvas.addEventListener("click", (event) => {
            // if the user clicks anywhere on the canvas, close any open context
            event.preventDefault();
            document.getElementById("context-menu").innerHTML = "";
        });
        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();

            const elem = document.getElementById("context-menu");
            let anyFound = false;
            this.markers.forEach((marker) => {
                if(marker.name == "player") {
                    return;
                }
                const targetWidth = marker.image.width;
                const targetHeight = marker.image.height;
                const canvasX = (marker.x - map.minX) * map.scale;
                const canvasY = (this.canvasYLocation(marker.y) - this.minY)  * map.scale;
                const canvasWidth = targetWidth * map.scale;
                const canvasHeight = targetHeight * map.scale;
                if(
                    event.offsetX > canvasX - canvasWidth / 4 && event.offsetX < canvasX + canvasHeight / 4 &&
                    event.offsetY > canvasY - canvasWidth / 4 && event.offsetY < canvasY + canvasHeight / 4
                ){
                    anyFound = true;
                    elem.classList.add("context-menu");
                    elem.innerHTML = `<aside class="menu" style="background-color: lightgray">
                                      <ul class="menu-list" class="is-danger">
                                        <li><a onclick="deleteMarkerPrompt('${marker.marker_id}')">Delete ${marker.name}</a></li>
                                      </ul>
                                    </aside>`;
                    elem.style.left = `${canvasX}px`;
                    elem.style.top = `${canvasY}px`;
                }
            })
            if(!anyFound) {
                elem.innerHTML = "";
            }
        })
    }

    markersRequest() {
        return fetch(`/markers/${this.x_center}/${this.y_center}/${256 * this.numBlocksWidth / 2}/`)
    }

    getMapBlocks() {
        // return 5x5 array of MapSection
        const mapSections = [];
        const eachWay = Math.floor(this.numBlocksWidth / 2);
        for(let x = -eachWay; x <= eachWay; x++){
            for(let y = -eachWay; y <= eachWay; y++){
                const mapSection = new MapSection(
                    this.x_center + 256 * x,
                    this.y_center + 256 * y
                );
                this.minX = Math.min(this.minX || 99999, mapSection.realXStart);
                this.minY = Math.min(this.minY || 99999, mapSection.canvasYLocation);

                mapSections.push(mapSection);
            }
        }
        return mapSections;
    }

    addMarkerImage(marker) {
        const targetWidth = marker.image.width * marker.scale;
        const targetHeight = marker.image.height * marker.scale;
        const canvasX = marker.x - this.minX - targetWidth / 2;
        const canvasY = this.canvasYLocation(marker.y) - this.minY - targetWidth / 2;
        this.ctx.drawImage(
            marker.image,
            canvasX,
            canvasY,
            targetWidth,
            targetHeight
        );
    }

    addText(label, x, y) {
        this.ctx.font = "30px Arial";
        this.ctx.fillText(label, x, y);
    }

    drawGrid() {
        // grid
        for(let i=1; i<5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 256, 0);
            this.ctx.lineTo(i * 256, 256 * this.numBlocksWidth);
            this.ctx.moveTo(0, i * 256);
            this.ctx.lineTo(256 * this.numBlocksWidth, i * 256);
            this.ctx.stroke();
        }
    }

    draw() {
        const ctx = this.ctx;
        const map = this;
        let totalLoaded = 0;
        this.blocks.forEach((block) => {
            if (block.imageUrl == null) {
                return;
            }
            const image = new Image();
            image.src = block.imageUrl;
            image.onload = function () {
                const xPos = block.canvasXLocation - map.minX;
                const yPos = block.canvasYLocation - map.minY;
                ctx.drawImage(image, xPos, yPos);
                //map.addText(`${block.xImageUrl}, ${block.yImageUrl}`, xPos + 20, yPos + 30)
                //ctx.stroke();
                if(++totalLoaded == map.blocks.length) {
                    map.markers = [];
                    map.markersReq.then(res => res.json()).then(json => {
                        for (const [key, value] of Object.entries(json)) {
                            const marker = new MapMarker(map, key, value.name, value["location_y"], value["location_x"], "chest-orange", 0.5)
                            map.markers.push(marker);
                        }
                        const marker = new MapMarker(map, "player", "player", map.x_center, map.y_center, "pos", 0.75)
                        map.markers.push(marker);
                    });

                    console.log(`Done! ${xPos}, ${yPos}`);
                }
            }
        });
    }
}

const drawMap = () => {
    const canvas = document.getElementById('canvas');
    const map = new Map(canvas, 10287.24, 3381.99);
    MAP_REFERENCE = map;
}

const addMapModal = () => {
    const res = fetch("/map/").then(res => res.text()).then(data => {
        createModal({
            title: "Map",
            content: data,
            width: 256 * NUM_BLOCKS_WIDTH * SCALE + 55,
            height: 256 * NUM_BLOCKS_WIDTH * SCALE + 195
        });
        const canvas = document.getElementById('canvas');
        const map = new Map(canvas, currentPosition["y"], currentPosition["x"]);
        MAP_REFERENCE = map;
    })
}