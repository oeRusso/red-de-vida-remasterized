import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Registrarme" };

export default function RegisterPage() {
  return (
    <AuthShell wide title="Crea tu cuenta" subtitle="Todos los datos son necesarios para poder agendar una cita.">
      <RegisterForm />
    </AuthShell>
  );
}
