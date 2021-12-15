const SCALE = 1;
const NUM_BLOCKS_WIDTH = 3;

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
        this.draw();
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

    addMarkerImage(x, y, typeId="chest-white", scale = 1) {
        const image = new Image();
        image.src = `/static/map_images/${typeId}.png`
        image.onload = () => {
            const targetWidth = image.width / 4 * scale;
            const targetHeight = image.height / 4 * scale;
            this.ctx.drawImage(
                image,
                x - this.minX - targetWidth / 2,
                this.canvasYLocation(y) - this.minY - targetWidth / 2,
                targetWidth,
                targetHeight
            );
            console.log("loaded!");
        }
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
                console.log("drawing");
                ctx.drawImage(image, xPos, yPos);
                //map.addText(`${block.xImageUrl}, ${block.yImageUrl}`, xPos + 20, yPos + 30)
                //ctx.stroke();
                if(++totalLoaded == map.blocks.length) {
                    map.markersReq.then(res => res.json()).then(json => {
                        for (const [key, value] of Object.entries(json)) {
                            map.addMarkerImage(value["location_y"], value["location_x"], "chest-orange", 1.5)
                        }
                        map.addMarkerImage(map.x_center, map.y_center, "pos", 3);
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
        const map = new Map(canvas, 10387.24, 3381.99);
    })
}