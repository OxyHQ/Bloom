package so.oxy.bloom.avatargpu

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Availability registration only: no GL dependency, view, context or renderer. */
class AvatarGPUModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BloomAvatarGPU")
    Constants("abiVersion" to 1, "available" to false)
  }
}
