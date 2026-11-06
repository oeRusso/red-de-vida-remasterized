import { mapEmbedUrl } from "@/domain/institution-directory";

/** Se monta con `key={address}` donde la dirección puede cambiar: así el iframe no conserva el mapa anterior. */
export function InstitutionMap({ name, address }: { name: string; address: string }) {
  return (
    <iframe
      title={`Mapa de ${name}`}
      src={mapEmbedUrl(address)}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-52 w-full rounded-2xl border-0 bg-canvas"
    />
  );
}
