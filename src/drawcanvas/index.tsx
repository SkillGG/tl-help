import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import {
    CanvasMouseEvent,
    ClickableRect,
    hexToColor,
    RectData,
    Size,
} from "../utils";

const def_green: [number, number, number] = [0, 255, 0];

type CanvasFunctions = {
    nextRect(): void;
    removeRect(): number | undefined;
};

interface DrawCanvasProps {
    size: Size;
    setDataID(n: number, r: RectData): void;
    offsetLeft: number;
    getData(id: number): string;
    onkeyup(
        e: React.KeyboardEvent<HTMLCanvasElement>,
        c: CanvasFunctions
    ): void;
    onkeydown(
        e: React.KeyboardEvent<HTMLCanvasElement>,
        c: CanvasFunctions
    ): void;
    style?: React.CSSProperties;
    colors?: [number, number, number][];
    fillFlag: boolean;
    triggerDelete: [boolean, () => void];
}

const DrawCanvas: FunctionComponent<DrawCanvasProps> = ({
    size,
    style,
    setDataID,
    offsetLeft,
    onkeydown,
    onkeyup,
    fillFlag,
    triggerDelete,
    getData,
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
            false,
            fillFlag
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
                r.draw(
                    ctx,
                    undefined,
                    undefined,
                    [
                        hexToColor("a2c5ac") || def_green,
                        hexToColor("92b59c") || def_green,
                    ],
                    getData(r.getID())
                )
            );
            if (drag !== false) {
                currentDrag.draw(ctx);
                ctx.stroke();
            }
        }
        ctx?.restore();
    };

    useEffect(() => {
        if (triggerDelete[0]) removeRect();
        triggerDelete[1]();
    }, [triggerDelete[0]]);

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
                    false,
                    e.altKey ? false : true,
                    fillFlag
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
                        return new ClickableRect(
                            [p.p, newSize],
                            false,
                            false,
                            p.isEllipse,
                            p.fillFlag
                        );
                    });
                }
            }
        }
    };

    const removeRect = () => {
        if (rects.length <= 0) return;
        const ncur = clickedList[clickedList.length - 2];
        const pop = clickedList[clickedList.length - 1];
        setClickedList((p) => {
            const u = [...p];
            u.pop();
            return u;
        });
        setRects((p) => {
            const u = [...p];
            u.splice(
                u.findIndex((r) => r.getID() === pop),
                1
            );
            return u;
        });
        if (ncur) {
            const next = rects.find((r) => r.getID() === ncur);
            console.log("nc,n", ncur, next?.getID());
            if (next) {
                const nextID = next.getID();
                moveIDToBottomOfClickedList(nextID);
                unclickEverythingExcept(nextID);
                setDataID(nextID, (next || rects[0]).getRectData());
            } else {
                unsetClicked();
            }
        } else {
            unsetClicked();
        }
        return pop;
    };

    const nextRect = () => {
        if (rects.length <= 0) return;
        const cur = clickedList[clickedList.length - 1];
        const next = rects.find((r) => r.getID() === 1 + cur);
        console.log(cur, next?.getID());
        let nextID = 1;
        if (next) nextID = next.getID();
        moveIDToBottomOfClickedList(nextID);
        unclickEverythingExcept(nextID);
        setDataID(nextID, (next || rects[0]).getRectData());
    };

    const moveIDToBottomOfClickedList = (id: number) => {
        setClickedList((p) => {
            const unique = [...p, id];
            unique.forEach((c) => {
                let z: number[];
                while ((z = unique.filter((n) => n === c)).length > 1)
                    unique.splice(unique.indexOf(z[0]), 1);
            });
            return unique;
        });
    };

    const unclickEverythingExcept = (id: number) => {
        setRects((p) =>
            p.slice().map((x) => {
                return new ClickableRect(
                    [x.p, x.s],
                    x.id,
                    x.getID() === id,
                    x.isEllipse,
                    x.fillFlag
                );
            })
        );
    };

    const unsetClicked = () => {
        setClickedList((p) => {
            const unique = [...p];
            unique.sort();
            return unique;
        });
        setRects((p) =>
            p.slice().map((x) => {
                return new ClickableRect(
                    [x.p, x.s],
                    x.id,
                    false,
                    x.isEllipse,
                    x.fillFlag
                );
            })
        );
        setDataID(0, [
            [0, 0],
            [0, 0],
        ]);
    };

    const canvasClick = (e: CanvasMouseEvent) => {
        const setClicked = (clicked: ClickableRect) => {
            const [data, id] = [clicked.getRectData(), clicked.getID()];
            moveIDToBottomOfClickedList(id);
            unclickEverythingExcept(id);
            setDataID(id, data);
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
                        false,
                        currentDrag.isEllipse,
                        currentDrag.fillFlag
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
                    onKeyUp={(e) => onkeyup(e, { nextRect, removeRect })}
                    onKeyDown={(e) => {
                        console.log(e.key);
                        onkeydown(e, { nextRect, removeRect });
                    }}
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
