import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import {
    CanvasMouseEvent,
    ClickableRect,
    hexToColor,
    RectData,
    Size,
} from "../utils";

const def_green: [number, number, number] = [0, 255, 0];

interface DrawCanvasProps {
    size: Size;
    setDataID(n: number, r: RectData): void;
    offsetLeft: number;
    onkeyup: React.KeyboardEventHandler<HTMLCanvasElement>;
    style?: React.CSSProperties;
    colors?: [number, number, number][];
}

const DrawCanvas: FunctionComponent<DrawCanvasProps> = ({
    size,
    style,
    setDataID,
    offsetLeft,
    onkeyup,
    colors,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [rects, setRects] = useState<ClickableRect[]>([]);

    const [drag, setDrag] = useState<number | false>(false);
    const [currentDrag, setCurrentDrag] = useState<ClickableRect>(
        new ClickableRect(
            [
                [0, 0],
                [0, 0],
            ],
            false,
            false
        )
    );

    const [clickedList, setClickedList] = useState<number[]>([]);

    const undoAdd = () => {
        // TODO: undo Add
        /**
         * Remove last Rect from rects
         */
    };

    const undoSelect = () => {
        // TODO: undo Select
        /**
         * Remove last from selectList
         */
    };

    const draw = () => {
        const canvasObj = canvasRef.current;
        const ctx = canvasObj?.getContext("2d");
        if (ctx) {
            ctx.beginPath();
            ctx.clearRect(0, 0, size[0], size[1]);
            rects.forEach((r) =>
                r.draw(ctx, undefined, [
                    hexToColor("a2c5ac") || def_green,
                    hexToColor("92b59c") || def_green,
                ])
            );
            if (drag !== false) {
                currentDrag.draw(ctx);
                ctx.stroke();
            }
        }
        ctx?.restore();
    };

    useEffect(() => {
        draw();
    });

    const getRelativeMousePos = (e: CanvasMouseEvent, r: HTMLCanvasElement) =>
        !r
            ? [0, 0]
            : [
                  e.clientX -
                      (canvasRef.current?.getBoundingClientRect()?.left || 0),
                  e.clientY -
                      (canvasRef.current?.getBoundingClientRect()?.top || 0),
              ];

    const canvasMouseDown = (e: CanvasMouseEvent) => {
        const canvasObject = canvasRef.current;
        if (canvasObject) {
            const [curX, curY] = getRelativeMousePos(e, canvasObject);
            if (e.button === 0) {
                if (drag === false) setDrag(rects.length);
                const rect: ClickableRect = new ClickableRect(
                    [
                        [curX, curY],
                        [0, 0],
                    ],
                    false,
                    false
                );
                setCurrentDrag((p) => rect);
            } else if (e.button === 2) {
                console.log(rects);
                const clicked: ClickableRect | undefined = rects.find((r) => {
                    return r.inside([curX, curY]);
                });
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };

    const canvasMouseMove = (e: CanvasMouseEvent) => {
        const canvasObject = canvasRef.current;
        if (canvasObject) {
            const [curX, curY] = getRelativeMousePos(e, canvasObject);
            if (e.button === 0) {
                if (drag !== false) {
                    setCurrentDrag((p) => {
                        const newSize: Size = [curX - p.p[0], curY - p.p[1]];
                        // console.log(
                        //     "Change size of the drag to",
                        //     newSize[0],
                        //     newSize[1]
                        // );
                        return new ClickableRect([p.p, newSize], false, false);
                    });
                }
            }
        }
    };

    const canvasClick = (e: CanvasMouseEvent) => {
        const setClicked = (clicked: ClickableRect) => {
            setClickedList((p) => {
                const unique = [...p, clicked.getID()];
                unique.forEach((c) => {
                    let z: number[];
                    while ((z = unique.filter((n) => n === c)).length > 1)
                        unique.splice(unique.indexOf(z[0]), 1);
                });
                return unique;
            });
            setRects((p) =>
                p.slice().map((x) => {
                    return new ClickableRect(
                        [x.p, x.s],
                        x.id,
                        x.id === clicked.id
                    );
                })
            );
            setDataID(clicked.getID(), clicked.getRectData());
        };

        const unsetClicked = () => {
            setClickedList((p) => {
                const unique = [...p];
                unique.sort();
                return unique;
            });
            setRects((p) =>
                p.slice().map((x) => {
                    return new ClickableRect([x.p, x.s], x.id, false);
                })
            );
            setDataID(0, [
                [0, 0],
                [0, 0],
            ]);
        };

        const canvasObject = canvasRef.current;
        if (canvasObject) {
            const [curX, curY] = getRelativeMousePos(e, canvasObject);
            const clickedAll: ClickableRect[] = rects.filter((r) => {
                return r.inside([curX, curY]);
            });
            if (clickedAll.length === 1) {
                const clicked = clickedAll[0];
                if (clicked) {
                    setClicked(clicked);
                }
            } else if (clickedAll.length > 0) {
                const clicked = clickedAll.reduce((p, n) => {
                    return clickedList.indexOf(p.getID()) <
                        clickedList.indexOf(n.getID())
                        ? p
                        : n;
                });
                if (clicked) {
                    setClicked(clicked);
                }
            } else {
                unsetClicked();
            }
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const canvasMouseUp = (e: CanvasMouseEvent) => {
        if (e.button === 0) {
            setDrag(false);
            if (currentDrag.s[0] * currentDrag.s[1] > 50) {
                setRects((p) => [
                    ...p,
                    new ClickableRect(
                        [currentDrag.p, currentDrag.s],
                        true,
                        false
                    ),
                ]);
                console.log("End Drag", currentDrag.toString());
            } else {
                canvasClick(e);
            }
        }
    };

    return (
        <>
            {
                <canvas
                    onKeyUp={onkeyup}
                    tabIndex={0}
                    style={{ ...style, left: `${offsetLeft}px` }}
                    ref={canvasRef}
                    width={size[0]}
                    height={size[1]}
                    onMouseDown={canvasMouseDown}
                    onMouseMove={canvasMouseMove}
                    onMouseUp={canvasMouseUp}
                    onContextMenu={(e) => e.preventDefault()}
                ></canvas>
            }
        </>
    );
};

export default DrawCanvas;