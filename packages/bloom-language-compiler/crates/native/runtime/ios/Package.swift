// swift-tools-version: 6.0
// The Bloom runtime for native iOS (ADR 0003): what `bloom-native --target swiftui` emits
// against. `Bloom` is the standard library on Foundation (it builds and tests on Linux too);
// `BloomTheme` is Bloom's colour engine and themes (Foundation only);
// `BloomUI` is BloomUI on SwiftUI (Apple platforms only).
import PackageDescription

let package = Package(
  name: "BloomRuntime",
  platforms: [.iOS(.v17), .macOS(.v14)],
  products: [
    .library(name: "Bloom", targets: ["Bloom"]),
    .library(name: "BloomTheme", targets: ["BloomTheme"]),
    .library(name: "BloomUI", targets: ["BloomUI"]),
  ],
  targets: [
    .target(
      name: "Bloom",
      path: "Sources/Bloom",
      linkerSettings: [
        // Linux: ICU's relative-time formatter (`ureldatefmt`) is reached through Foundation's
        // own ICU, which swift-corelibs-foundation does not wrap. Apple platforms use Foundation.
        .linkedLibrary("_FoundationICU", .when(platforms: [.linux]))
      ]
    ),
    .target(name: "BloomTheme", path: "Sources/BloomTheme"),
    .target(name: "BloomUI", dependencies: ["Bloom", "BloomTheme"], path: "Sources/BloomUI"),
    .testTarget(
      name: "BloomTests",
      dependencies: ["Bloom"],
      path: "Tests/BloomTests",
      // The fixtures are read from the source tree (`#filePath`), not bundled.
      exclude: ["Fixtures"]
    ),
    .testTarget(name: "BloomThemeTests", dependencies: ["BloomTheme"], path: "Tests/BloomThemeTests"),
  ]
)
