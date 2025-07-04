{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };
  outputs = {
    self,
    nixpkgs,
  }: let
    supportedSystems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];

    # small tool to iterate over each system
    eachSystem = f:
      nixpkgs.lib.genAttrs supportedSystems (system: let
        pkgs = import nixpkgs { inherit system; };
      in
        f pkgs);
  in {
    # Used by `nix develop` or `direnv` to open a devShell
    devShells = eachSystem (pkgs: let
    in {
      default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          nodejs
        ];
      };
    });
  };
}
