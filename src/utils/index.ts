import React from "react";

export type Size = [number, number];
export type Point = [number, number];
export type CanvasMouseEvent = React.MouseEvent<HTMLCanvasElement, MouseEvent>;

export type RectData = [Point, Size];

export class Rect {
    s: Size;
    p: Point;
    id: number;
    isEllipse: boolean;
    fillFlag: boolean;
    static n: number = 0;
    constructor(
        sp: RectData,
        i: boolean | number,
        e: boolean = false,
        fill: boolean = false
    ) {
        this.p = sp[0];
        this.s = sp[1];
        if (i) {
            this.orient();
        }
        this.id = i === true ? Rect.n++ : typeof i === "number" ? i : -1;
        this.isEllipse = e;
        this.fillFlag = fill;
    }
    orient() {
        if (this.s[0] < 0) {
            this.s[0] -= 2 * this.s[0];
            this.p[0] -= this.s[0];
        }
        if (this.s[1] < 0) {
            this.s[1] -= 2 * this.s[1];
            this.p[1] -= this.s[1];
        }
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.rect(this.p[0], this.p[1], this.s[0], this.s[1]);
        if (this.fillFlag) ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    move(p: Point) {
        this.p = [...p];
    }
    resize(s: Size) {
        this.s = [...s];
    }
    intersects(r: Rect | RectData): boolean {
        let X1 = this.p[0],
            Y1 = this.p[1],
            W1 = this.s[0],
            H1 = this.s[1];
        let X2, Y2, W2, H2;
        if (r instanceof Rect) {
            X2 = r.p[0];
            Y2 = r.p[1];
            W2 = r.s[0];
            H2 = r.s[1];
        } else {
            X2 = r[0][0];
            Y2 = r[0][1];
            W2 = r[1][0];
            H2 = r[1][1];
        }
        return !(X1 + W1 < X2 || X2 + W2 < X1 || Y1 + H1 < Y2 || Y2 + H2 < Y1);
    }
    toString(): string {
        return `Rect#${this.id}: <${this.p[0]}, ${this.p[0] + this.s[0]}>,  <${
            this.p[1]
        }, ${this.p[1] + this.s[1]}> `;
    }
    inside(p: Point): boolean {
        return (
            p[0] > this.p[0] &&
            p[0] < this.p[0] + this.s[0] &&
            p[1] > this.p[1] &&
            p[1] < this.p[1] + this.s[1]
        );
    }
    getID() {
        return (this.id - 1) / 2 + 1;
    }
    getRectData(): RectData {
        return [this.s, this.p];
    }
}

export type Color = [number, number, number];

export class ClickableRect extends Rect {
    clicked: boolean;
    constructor(
        sp: RectData,
        i: boolean | number,
        clicked: boolean,
        e: boolean = false,
        fill: boolean = false
    ) {
        super(sp, i, e, fill);
        this.clicked = clicked;
    }
    draw(
        ctx: CanvasRenderingContext2D,
        rect?: boolean,
        c_unselected?: [Color, Color],
        c_selected?: [Color, Color]
    ): void {
        let green, border_green;
        let black, border_black;
        const iE = rect === undefined ? this.isEllipse : rect;
        if (c_selected) {
            green = `rgb(${c_selected[0][0]},${c_selected[0][1]},${c_selected[0][2]})`;
            border_green = `rgb(${c_selected[1][0]},${c_selected[1][1]},${c_selected[1][2]})`;
        } else {
            green = "green";
            border_green = "green";
        }
        if (c_unselected) {
            black = `rgb(${c_unselected[0][0]},${c_unselected[0][1]},${c_unselected[0][2]})`;
            border_black = black;
        } else {
            black = "black";
            border_black = black;
        }
        ctx.beginPath();
        if (iE) ctx.rect(this.p[0], this.p[1], this.s[0], this.s[1]);
        else
            ctx.ellipse(
                this.p[0] + this.s[0] / 2,
                this.p[1] + this.s[1] / 2,
                this.s[0] / 2,
                this.s[1] / 2,
                0,
                0,
                2 * Math.PI
            );
        ctx.strokeStyle = this.clicked ? green : black;
        if (this.fillFlag) {
            ctx.fillStyle = "white";
            ctx.fill();
        }
        ctx.stroke();
        if (this.clicked) {
            const pfs = ctx.fillStyle;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = green;
            ctx.rect(this.p[0], this.p[1], this.s[0], this.s[1]);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = pfs;
        }
        if (this.id != -1) {
            ctx.fillStyle = this.clicked ? green : black;
            const m = ctx.measureText(`Text${this.id}`);
            ctx.fillRect(
                this.p[0],
                this.p[1] - m.actualBoundingBoxAscent - 10,
                m.width + 10,
                m.actualBoundingBoxAscent + 10
            );
            ctx.fillStyle = "red";
            ctx.fillText(`Text${this.getID()}`, this.p[0] + 5, this.p[1] - 5);
        }
        ctx.closePath();
    }
}

export type Data = [string, RectData];

export const hexToColor = (s: string): [number, number, number] | undefined => {
    if (s.length !== 3 && s.length !== 6) return;
    if (s.length === 3)
        s =
            s.charAt(0).repeat(2) +
            s.charAt(1).repeat(2) +
            s.charAt(2).repeat(2);
    if (s.length === 6)
        return [
            parseInt(s.substring(0, 2), 16),
            parseInt(s.substring(2, 4), 16),
            parseInt(s.substring(4, 6), 16),
        ];
};
