import { useState } from "react";
import c from "./components.module.css"

export function CopyButton({ text }: {text: string}) {
    const [ok, setOk] = useState(false);
    async function onCopy() {
        await navigator.clipboard.writeText(text);
        setOk(true); setTimeout(() => setOk(false), 1200);
    }
    return (
        <button type="button" onClick={onCopy} className={c?.btn ?? ""} aria-label="Copy code">
            {ok ? "Copied" : "Copy"}
        </button>
    );
}