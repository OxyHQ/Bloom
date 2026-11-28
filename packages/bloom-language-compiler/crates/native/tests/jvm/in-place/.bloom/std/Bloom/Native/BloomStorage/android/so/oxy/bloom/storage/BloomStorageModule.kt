// Bloom's native storage module (ADR 0002, section 7): the Android side of
// `extern native "BloomStorage"` (stdlib/Bloom/Storage.bloom).
package so.oxy.bloom.storage

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray

/**
 * The stores of `KeyValueStore`, `SecureStore` and `FileStore`, by `kind`: `kv` in SQLite,
 * `secure` encrypted with a key the Android Keystore holds, `file` in the app's files.
 *
 * [NativeBloomStorageSpec] is React Native's codegen output for the spec `bloom build`
 * generates from the Bloom interface, so this class is checked against that interface by
 * the Kotlin compiler. Every method is synchronous (the spec's methods return a value), so
 * a write is seen by the read after it; each runs on the JS thread and is a few
 * microseconds of SQLite or file I/O, or one Keystore operation for a secret.
 */
class BloomStorageModule(context: ReactApplicationContext) : NativeBloomStorageSpec(context) {
  private val kvStore = lazy { KeyValueStore(context) }
  private val kv by kvStore
  private val secure by lazy { SecureStore(context) }
  private val files by lazy { FileStore(context) }
  private val databasesStore = lazy { Databases(context) }
  private val databases by databasesStore

  private fun store(kind: String): Store =
    when (kind) {
      "kv" -> kv
      "secure" -> secure
      "file" -> files
      else -> throw IllegalArgumentException("BloomStorage: no store kind `$kind` (kv, secure, file)")
    }

  override fun get(kind: String, name: String, key: String): String? = store(kind).get(name, key)

  override fun set(kind: String, name: String, key: String, value: String?): Boolean {
    store(kind).set(name, key, value)
    return true
  }

  override fun keys(kind: String, name: String): WritableArray {
    val out = Arguments.createArray()
    for (key in store(kind).keys(name)) out.pushString(key)
    return out
  }

  // ---- `@Model`'s SQLite: a database by handle (a number in the spec) ----

  override fun sqlOpen(name: String): Double = databases.open(name).toDouble()

  override fun sqlExec(db: Double, source: String): Boolean {
    databases.exec(db.toInt(), source)
    return true
  }

  override fun sqlRun(db: Double, source: String, params: String): Double =
    databases.run(db.toInt(), source, params).toDouble()

  override fun sqlAll(db: Double, source: String, params: String): String = databases.all(db.toInt(), source, params)

  override fun sqlClose(db: Double): Boolean {
    databases.close(db.toInt())
    return true
  }

  override fun sqlDelete(name: String): Boolean {
    databases.delete(name)
    return true
  }

  override fun invalidate() {
    super.invalidate()
    if (kvStore.isInitialized()) kv.close()
    if (databasesStore.isInitialized()) databases.closeAll()
  }
}
