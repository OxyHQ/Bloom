# Published editor package candidate

Status: verified for the platform-free model export. Physical Android editor
acceptance remains not run.

## Provenance

- Bloom source commit: `56629a91bcab4266051a5fcd1f5d163da8ba7403`
- Release inspector: `OxyHQ/oxy` commit
  `4041a1760e80024bf12685a0ca171a5a4d745639`
- Package: `@oxy.so/bloom-editor@0.8.0`
- Declared Bloom peer: `^17.24.0`; this is the published minimum API version.
- Packed Bloom Text dependency: `@oxy.so/bloom-text@^0.1.6`.
- Tarball SHA-512:
  `c4ac9bc9c07b6b3021bfac162ff1891626dee3d5ba3abd1ff4e7375e88ab07a9ceadfe7d4ba31306a4ad3c689e16800b0460a0a965fc9b29eaa1d8aabca3cf14`

## Checks

The release workflow's pack and inspect commands ran against the built workspace
tree. The inspector reported `528 files, every check passed`: package identity,
all declared entry points present, no unresolved workspace ranges, the workspace
dependency pinned to this commit's Bloom Text version, and consumer ranges
available from the registry.

The exact tarball was installed into a fresh temporary npm consumer with lifecycle
scripts disabled. Requiring `@oxy.so/bloom-editor/model` through Node's package
export resolver succeeded: 73 exports were available, `EditorStore` resolved to
a function, and `DEFAULT_SCHEMA` resolved to an object. The consumer only imports
the platform-free model, so this does not establish React editor or native UI
behavior.

No repository `node_modules` package was replaced. The tarball and consumer
directory were temporary artifacts under `/tmp`.
