import { NameSelection } from "@/components/name-selection";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Trouvez le prénom parfait
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explorez les tendances des prénoms français de 1900 à 2022.
          Recherchez, comparez et partagez vos favoris via un simple lien.
        </p>
      </div>
      <NameSelection />
    </div>
  );
}
