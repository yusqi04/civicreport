import { requireUser } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfilPage() {
  const user = await requireUser();

  const roleLabel = user.role === "admin" ? "Admin" : "Warga";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi dasar akun Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Akun</CardTitle>
          <CardDescription>Email dan role dikelola sistem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role: </span>
            {roleLabel}
          </p>
          <p>
            <span className="text-muted-foreground">Terdaftar: </span>
            {new Date(user.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ubah Nama</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={user.full_name} />
        </CardContent>
      </Card>
    </div>
  );
}
