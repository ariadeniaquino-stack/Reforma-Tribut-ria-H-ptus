"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const addFiles = useFiscalStore((s) => s.addFiles);
  const isProcessing = useFiscalStore((s) => s.isProcessing);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    await addFiles(Array.from(list));
  }

  return (
    <div
      className={`dropzone${drag ? " drag" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xml,.zip"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="dropzone-icon">
        {isProcessing ? <Loader2 size={30} className="spin" /> : <UploadCloud size={30} />}
      </div>
      <h3 style={{ marginBottom: 6 }}>
        {isProcessing ? "Processando documentos…" : "Arraste XMLs ou ZIPs aqui"}
      </h3>
      <p style={{ color: "var(--muted)", margin: 0 }}>
        ou clique para selecionar. Aceita NF-e, NFC-e, CT-e e NFS-e (padrão nacional).
        Tudo processado localmente no seu navegador.
      </p>
    </div>
  );
}
