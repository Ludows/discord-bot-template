// Mock `require.main` pour les tests si besoin
if (typeof require !== "undefined") {
  require.main = undefined as any;
}
