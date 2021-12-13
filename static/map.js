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
        if(imgX > 55 || imgX < 0 || imgY > 256 || imgY < 0) {
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

    get imageUrl() {
        if(this.blockIndex == null) {
            return null;
        }
        return `/map/${this.xImageUrl}/${this.yImageUrl}/`;
    }
}

class Map {
    constructor(canvas, x_center, y_center, size=256) {
        this.x_center = x_center;
        this.y_center = y_center;
        console.log(`${this.x_center}, ${this.y_center}`)
        this.canvas = canvas;
        this.canvas.width = size * 3;
        this.canvas.height = size * 3;
        this.ctx = canvas.getContext("2d");
        this.ctx.transform(1, 0, 0, -1, 0, canvas.height);
        this.blocks = this.getMapBlocks();
        this.draw();
        this.addTreasure(100, 100);
    }

    getMapBlocks() {
        // return 5x5 array of MapSection
        const mapSections = [];
        for(let x = -2; x <= 2; x++){
            for(let y = -2; y <= 2; y++){
                mapSections.push(new MapSection(
                    this.x_center + 256 * x,
                    this.y_center + 256 * y
                ));
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
        this.ctx.scale(1, -1);
        this.ctx.strokeText(label, x, -y);
    }

    draw() {
        const ctx = this.ctx;
        const map = this;
        const totalBlocks = this.blocks.length;
        let blocksLoaded = 0;
        this.blocks.forEach((block) => {
            if (block.imageUrl == null) {
                return;
            }
            const image = new Image();
            image.src = block.imageUrl;
            image.onload = function () {
                blocksLoaded++;
                const xPos = -(block.realXStart - map.x_center + 256 * 2.5);
                const yPos = -(block.realYStart - map.y_center + 256 * 2.5);
                console.log(`${xPos}, ${yPos}`)
                ctx.drawImage(image, xPos, yPos);
                if(blocksLoaded == totalBlocks) {
                    // const imageData = ctx.getImageData(map.x_center, map.y_center, ctx.canvas.width, ctx.canvas.height);
                    // ctx.putImageData(imageData, -256, -256);
                    // now clear the right-most pixels:
                    //ctx.clearRect(ctx.canvas.width-1, 0, 1, ctx.canvas.height);
                }
            }
        });
    }
}

const drawMap = () => {
    const canvas = document.getElementById('canvas');
    const map = new Map(canvas, 10947, 3310);
}

const addMapModal = () => {
    const res = fetch("/map/").then(res => res.text()).then(data => {
        createModal({
            title: "Map",
            content: data,
            customWidth: 500 + 50
        });
        const canvas = document.getElementById('canvas');
        const map = new Map(canvas, 10947, 3310);
    })
}