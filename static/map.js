class MapMarker {
    constructor(mapCanvas) {

    }
}

class MapSection {
    constructor(x, y, pixelsPerImage = 256) {
        this.max_y = pixelsPerImage * 56;
        this.x = x;
        this.y = y;
    }
}

class Map {
    constructor(canvas, x, y, size=256) {
        this.canvas = canvas;
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.ctx = canvas.getContext("2d");
        this.ctx.transform(1, 0, 0, -1, 0, canvas.height);
        this.draw();
        this.addTreasure(100, 100);
    }

    addTreasure(x, y) {
        this.ctx.scale(-1, -1);
        const image = new Image();
        image.src = "/static/map_images/chest.png"
        const targetWidth = image.width / 2;
        const targetHeight = image.height / 2;
        image.onload = () => {
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
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(500, 500);

        this.ctx.stroke();
    }



    getImagePathsArray() {
        const pixels = this.pixelsPerImage;
        const max_y = pixels * 56;
        const y_img_val = Math.floor((max_y - y) / pixels);
        const x_img_val = Math.floor(x / pixels);
        const paths = [];
        for (let x = -1; x <= 1; x++) {
            const arr = [];
            for (let y = -1; y <= 1; y++) {
                const xUrl = Math.floor(x_img_val + x);
                const yUrl = Math.floor(y_img_val + y);
                arr.push(`/map/${xUrl}/${yUrl}/`)
            }
            paths.push(arr);
        }
    }
}