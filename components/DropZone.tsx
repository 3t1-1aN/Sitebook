"use client"

type DropZoneProps = {
  busy: boolean
  notice: string | null
  onFiles: (files: FileList | File[]) => void
}

export function DropZone({ busy, notice, onFiles }: DropZoneProps) {
  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files)
      }}
      className="flex min-h-16 cursor-pointer items-center justify-between gap-4 border border-rule bg-paper-deep px-4 py-3 text-[12px] tracking-[0.04em] text-ink-soft"
    >
      <span>
        {busy
          ? "Saving dropped images…"
          : "Drop PNG / JPEG / WebP here. Then run /classify to file plates."}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files)
          event.target.value = ""
        }}
      />
      {notice ? <span className="text-accent">{notice}</span> : null}
    </label>
  )
}
