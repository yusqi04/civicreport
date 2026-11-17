import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Construction className="mb-2 h-10 w-10 text-primary" aria-hidden />
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Halaman ini akan diimplementasikan pada sprint berikutnya.
        </CardContent>
      </Card>
    </div>
  );
}
