import { forwardRef, useEffect, useRef, useState } from "react";
import "./css/App.css";
import DrawCanvas from "./drawcanvas";
import { Size, Point, Data } from "./utils";

type DataMap = Map<number, Data>;

/** React app start-point */
function App() {
    /**
     * Has image been loaded
     */
    const [loaded, setLoaded] = useState(false);
    /**
     * Base64 image data
     */
    const [loadedImage, setLoadedImage] = useState<string>("");
    /**
     * Image's MIME type
     */
    const [loadedMIME, setLoadedMIME] = useState<string>("");

    /**
     * Delete interval
     */
    const [delInt, setDelInt] = useState<number>();
    const [delCount, setDelCount] = useState<number>(0);

    /**
     * Canvas's ref
     */
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [deleteFlag, setDeleteFlag] = useState(false);

    const [info, setInfo] = useState<string>("");

    /**
     * Canvas size and placement
     */
    const [canvasSize, setCanvasSize] = useState<Size>([0, 0]);
    const [canvasOffset, setCanvasOffset] = useState<number>(0);

    /**
     * Canvas' selected RectID
     */
    const [dataID, setDataID] = useState<number>(0);

    /**
     * List of all data corresponding to any Rect
     */
    const [dataValues, setDataValues] = useState<DataMap>(new Map());

    const [fillFlag, setFillFlag] = useState<boolean>(false);

    /**
     * TextArea Ref
     */
    const textRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Navigation options
     */
    type NavOpt = {
        text: string;
        onclick: React.MouseEventHandler<HTMLLIElement>;
        customCSS?: [string?, string?, string?];
        sub?: NavOpt[];
    };

    const openFileDialog = (
        a: string,
        m: boolean,
        getData: (files: FileList | null) => void
    ) => {
        const i = document.createElement("input");
        i.type = "file";
        i.style.display = "none";
        i.accept = a;
        i.multiple = m;
        i.onchange = () => {
            getData(i.files);
        };
        i.click();
    };

    const removeDataFor = (n: number) => {
        setDataValues((p) => {
            const u = [...p];
            u.splice(
                u.findIndex((r) => r[0] === n),
                1
            );
            return new Map(u);
        });
    };

    const options: NavOpt[] = [
        {
            text: "File",
            onclick: (e) => {},
            sub: [
                {
                    text: "Load IMG(s)",
                    onclick: (e) => {
                        // create file input dialog
                        openFileDialog(".jpg,.png,.bmp", false, (files) => {
                            if (files) {
                                [...files].forEach(async (r) => {
                                    // get every file's blob
                                    const blob = r.slice();
                                    // change blob to an array of bytes
                                    const bytes = await blob.arrayBuffer();
                                    // array of bytes to base64 conversion
                                    const base64 = btoa(
                                        new Uint8Array(bytes).reduce(
                                            (data, byte) =>
                                                data +
                                                String.fromCharCode(byte),
                                            ""
                                        )
                                    );
                                    // set loaded image's data
                                    // TODO: Handle multi-file
                                    setLoadedMIME(r.type);
                                    setLoadedImage(base64);
                                    setLoaded(true);
                                    setInfo(`Loaded file: ${r.name}`);
                                });
                            }
                        });
                    },
                },
                {
                    text: "Load .TLF",
                    onclick: () => {
                        // TODO: Load from .TLF File
                        const input = document.createElement("input");
                        input.type = "file";
                    },
                },
                {
                    text: "Load .xTLF",
                    onclick: () => {
                        // TODO: Load from .TLF File
                    },
                },
            ],
        },
        {
            text: "Save",
            onclick: (e) => {},
            sub: [
                {
                    text: "As .TLF",
                    onclick: () => {
                        // change data to TLF file format string
                        const data = [...dataValues];
                        let preFile = "";
                        let postFile = "";
                        data.forEach((r) => {
                            const str = r[1][0];
                            const id = r[0];
                            const rect = r[1][1];
                            if (id) {
                                preFile += `${id}:${str}\n`;
                                postFile += `${id}{${rect[0]}/${rect[1]}};`;
                            }
                        });
                        const fileData = `${preFile}\n\n${postFile}`;
                        // change string to blob
                        const blob = new Blob([fileData], {
                            type: "text/plain",
                        });
                        // create a link to a blob
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        // download with default name "fiile.TLF" TODO: get project's/file's name from somewhere else
                        a.setAttribute("download", "file.TLF");
                        // open savefiledialog window and download
                        a.click();
                        // prevent user from re-download
                        URL.revokeObjectURL(a.href);
                    },
                },
                {
                    text: "As .xTLF",
                    onclick: (e) => {
                        // TODO: Add xTLF
                    },
                },
            ],
        },
        {
            text: "Options",
            onclick: (e) => {},
            sub: [
                {
                    text: `${fillFlag ? "[V]" : ""} Fill (Alt+F)`,
                    onclick: (e) => {
                        setFillFlag(!fillFlag);
                    },
                },
                {
                    text: "Delete (Alt + Delete)",
                    onclick: (e) => {
                        setDeleteFlag(true);
                    },
                },
            ],
        },
        {
            text: "Instructions",
            onclick: (e) => {},
        },
        {
            text: `${info}`,
            onclick: (e) => {},
            customCSS: ["no-back no-hover allow-copy"],
        },
    ];
    /**
     *
     * @param o NavOpt to convert
     * @param cn className of sub-items
     * @returns JSX that NavOpt was converted to
     */
    const noToJSX = (o: NavOpt, cn: string) => {
        const key = `${cn}_${o.text}`;
        return o.text ? (
            <li
                key={key}
                className={o.customCSS?.[0] || ""}
                onClick={o.onclick}
            >
                <span key={`s${key}`} className={o.customCSS?.[1] || ""}>
                    {o.text}
                </span>
                {o.sub && (
                    <ul
                        key={`sub_${key}`}
                        className={`${cn} ${o.customCSS?.[2] || ""}`}
                    >
                        {o.sub.map((r) => noToJSX(r, "micro"))}
                    </ul>
                )}
            </li>
        ) : (
            <></>
        );
    };

    /**
     * Set DataValue
     * @param str string to set the value to
     * @param rect rectangle position and size (if new rectangle)
     */
    const setDV = (str: string, rect?: [Point, Size]): void => {
        if (dataID) {
            setDataValues((p) => {
                const ndv = [...p];
                const last = ndv[ndv.length - 1];
                const r = rect || last[1][1];
                return new Map([...p, [dataID, [str, r]]]);
            });
            if (textRef.current) {
                textRef.current.style.height = "auto";
                textRef.current.style.height = `${textRef.current.scrollHeight}px`;
            }
        }
    };

    // TODO: Canvas-Line-Break https://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks

    /** Disable Tab changing places */
    document.onkeydown = (e) => {
        if (e.key === "Tab" || e.key === " ") {
            e.preventDefault();
        }
    };

    return (
        <div>
            <nav className="menu">
                <ul key={"main"}>
                    {options.map((o) => noToJSX(o, "sub-menu"))}
                </ul>
            </nav>
            {loaded && (
                <>
                    <main>
                        <div className="draw">
                            <div className="under">
                                <img
                                    src={`data:${loadedMIME};base64,${loadedImage}`}
                                    alt="Sorry corrupted file"
                                    onLoad={(e) => {
                                        setCanvasSize([
                                            e.currentTarget.naturalWidth,
                                            e.currentTarget.naturalHeight,
                                        ]);
                                        setCanvasOffset(
                                            e.currentTarget.offsetLeft
                                        );
                                    }}
                                />
                            </div>

                            <DrawCanvas
                                triggerDelete={[
                                    deleteFlag,
                                    () => setDeleteFlag(false),
                                ]}
                                fillFlag={fillFlag}
                                getData={(id) =>
                                    [...dataValues].find(
                                        (v) => v[0] === id
                                    )?.[1][0] || ""
                                }
                                onkeydown={(e, canv) => {
                                    const rem = () => {
                                        setDelCount(delCount + 1);
                                        const val = textRef.current?.value;
                                        if (val) {
                                            setDV(
                                                !e.shiftKey
                                                    ? val.substring(
                                                          0,
                                                          val.length -
                                                              (delCount + 1)
                                                      )
                                                    : val.substring(
                                                          0,
                                                          val.lastIndexOf(" ")
                                                      )
                                            );
                                        }
                                    };
                                    console.log("okd", e.key, e.altKey);
                                    if (e.key === "Delete" && e.altKey) {
                                        const rmv = canv.removeRect();
                                        if (rmv) removeDataFor(rmv);
                                    } else if (
                                        e.key === "Backspace" ||
                                        e.key === "Delete"
                                    ) {
                                        rem();
                                        if (!delInt)
                                            setDelInt(setInterval(rem, 100));
                                    }
                                }}
                                onkeyup={(e, canv) => {
                                    if (e.key === "Tab") canv.nextRect();
                                    else if (e.key === "c" && e.ctrlKey) {
                                        const d = dataValues.get(dataID)?.[0];
                                        if (d) navigator.clipboard.writeText(d);
                                        setInfo("Copied to clipboard!");
                                    } else if (
                                        e.key.length === 1 &&
                                        !e.altKey
                                    ) {
                                        if (
                                            textRef.current &&
                                            !textRef.current.disabled
                                        ) {
                                            textRef.current.value += e.key;
                                            setDV(textRef.current.value);
                                        }
                                    } else if (e.key === "f" && e.altKey) {
                                        setFillFlag(!fillFlag);
                                        console.log("alt + f");
                                    } else if (
                                        e.key === "Backspace" ||
                                        e.key === "Delete"
                                    ) {
                                        if (delInt) {
                                            clearInterval(delInt);
                                            setDelInt(0);
                                            setDelCount(0);
                                        }
                                    }
                                    if (e.key === "Enter") {
                                        if (textRef.current)
                                            setDV(textRef.current.value + "\n");
                                    }
                                }}
                                setDataID={(x, rect) => {
                                    setDataID(x);
                                    setDataValues((p) => {
                                        if (p.has(x) || !p) return p;
                                        else
                                            return new Map([
                                                ...p,
                                                [x, ["", rect]],
                                            ]);
                                    });
                                }}
                                size={canvasSize}
                                offsetLeft={canvasOffset}
                            />
                        </div>
                        <div>
                            <div id="text">
                                <span>
                                    {dataID
                                        ? `Text #${dataID}`
                                        : "Select text to describe"}
                                </span>
                                {/*                                <span>
                                    {[...dataValues].map((dv) => (
                                        <>
                                            {dvToStr([dv[0], dv[1]])}
                                            <br />
                                        </>
                                    ))}
                                    </span>*/}
                                <textarea
                                    name="text"
                                    id="text"
                                    ref={textRef}
                                    placeholder="Type here"
                                    onInput={(e) => {
                                        e.currentTarget.style.height = "auto";
                                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                                    }}
                                    onChange={(e) => {
                                        setDV(e.currentTarget.value || "");
                                    }}
                                    onFocus={() =>
                                        document
                                            .querySelector("canvas")
                                            ?.focus()
                                    }
                                    disabled={dataID ? false : true}
                                    value={dataValues.get(dataID)?.[0] || ""}
                                ></textarea>
                            </div>
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}

export default App;
