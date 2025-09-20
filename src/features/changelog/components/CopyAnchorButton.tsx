import style from "./components.module.css";

export function CopyAnchorButton({ anchorId }: { anchorId: string }) {
  const onCopy = async () => {
    const url = `${window.location.origin}/changelog#${anchorId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // no-op
    }
  };
  return (
    <button className={style.copyLinkBtn} onClick={onCopy} aria-label="Copy link to this entry">
      #
    </button>
  );
}