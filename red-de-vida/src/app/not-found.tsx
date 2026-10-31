import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="m-auto px-4 py-20 text-center">
      <h1 className="text-4xl">Página no encontrada</h1>
      <p className="mt-2 text-muted">La página que buscas no existe o cambió de lugar.</p>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        Volver al inicio
      </Link>
    </div>
  );
}
