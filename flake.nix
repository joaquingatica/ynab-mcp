{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    supportedSystems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];

    eachSystem = f:
      nixpkgs.lib.genAttrs supportedSystems (system:
        f (import nixpkgs { inherit system; })
      );
  in {
    devShells = eachSystem (pkgs: {
      default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          nodejs
          jq
        ];
      };
    });
  };
}
