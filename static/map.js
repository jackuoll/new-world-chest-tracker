class MapMarker {
    constructor(mapCanvas) {

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
        this.scale = 1;
        this.canvas = canvas;
        this.canvas.width = 256 * 56 * this.scale;
        this.canvas.height = 256 * 56 * this.scale;
        this.ctx = canvas.getContext("2d");
        this.ctx.scale(this.scale, this.scale);
        this.blocks = this.getMapBlocks();
        this.draw();
        // this.addTreasure(100, 100);
    }

    get canvasYCenter() {
        return Math.abs(256 * 56 - this.y_center);
    }

    getMapBlocks() {
        // return 5x5 array of MapSection
        const mapSections = [];
        const eachWay = 2;
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

    addTreasure(x, y) {
        this.ctx.scale(-1, -1);
        const image = new Image();
        image.src = "/static/map_images/chest.png"
        image.onload = () => {
            const targetWidth = image.width / 2;
            const targetHeight = image.height / 2;
            this.ctx.drawImage(
                image,
                -x - targetWidth / 2,
                -y - targetHeight / 2,
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
                map.addText(`${block.xImageUrl}, ${block.yImageUrl}`, xPos + 20, yPos + 30)
                ctx.beginPath();
                ctx.moveTo(xPos, 0);
                ctx.lineTo(xPos, 256 * 5);
                ctx.moveTo(0, yPos);
                ctx.lineTo(256 * 5, yPos);
                ctx.stroke();
                if(++totalLoaded == map.blocks.length) {
                    ctx.beginPath();
                    ctx.arc(
                        map.x_center % 256 + 256 * 2, Math.abs(256 * 5 - (map.y_center % 256 + 256 * 2)), 2, 0, 2 * Math.PI);
                    ctx.stroke();
                    console.log(`Done! ${xPos}, ${yPos}`);
                }
            }
        });
    }
}

const drawMap = () => {
    const canvas = document.getElementById('canvas');
    const map = new Map(canvas, 10387.24, 3381.99);
}

const addMapModal = () => {
    const res = fetch("/map/").then(res => res.text()).then(data => {
        createModal({
            title: "Map",
            content: data,
            width: 840,
            height: 970
        });
        const canvas = document.getElementById('canvas');
        const map = new Map(canvas, 10387.24, 3381.99);
    })
}