"use client"

type DropZoneProps = {
  busy: boolean
  notice: string | null
  passcodeRequired: boolean
  passcode: string
  onPasscode: (value: string) => void
  onFiles: (files: FileList | File[]) => void
}

export function DropZone({
  busy,
  notice,
  passcodeRequired,
  passcode,
  onPasscode,
  onFiles,
}: DropZoneProps) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files)
      }}
      className="flex min-h-16 flex-wrap items-center justify-between gap-4 border border-rule bg-paper-deep px-4 py-3 text-[12px] tracking-[0.04em] text-ink-soft"
    >
      <label className="cursor-pointer">
        <span>
          {busy
            ? "Saving dropped images…"
            : passcodeRequired
              ? "Drop PNG / JPEG / WebP here. Passcode first, then run /classify."
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
      </label>
      {passcodeRequired ? (
        <input
          type="password"
          value={passcode}
          onChange={(event) => onPasscode(event.target.value)}
          placeholder="Passcode"
          autoComplete="off"
          className="border border-rule bg-paper px-3 py-2 text-[12px] text-ink outline-none"
        />
      ) : null}
      {notice ? <span className="text-accent">{notice}</span> : null}
    </div>
  )
}
