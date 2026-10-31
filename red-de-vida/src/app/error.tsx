"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <div className="m-auto px-4 py-20 text-center">
      <h1 className="text-4xl">Algo salió mal</h1>
      <p className="mt-2 text-muted">No pudimos cargar esta página. Inténtalo de nuevo en unos segundos.</p>
      <Button className="mt-6" onClick={retry}>
        Reintentar
      </Button>
    </div>
  );
}
