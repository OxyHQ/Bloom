// Bloom's native storage module: its three stores.
package so.oxy.bloom.storage

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.database.sqlite.SQLiteStatement
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.io.File
import java.net.URLDecoder
import java.net.URLEncoder
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** A store's strings: `(name, key) -> value`; a `null` value removes the key. */
internal interface Store {
  fun get(name: String, key: String): String?

  fun set(name: String, key: String, value: String?)

  fun keys(name: String): List<String>
}

/** `kv`: one SQLite table, `(name, key) -> value`, with its statements compiled once. */
internal class KeyValueStore(context: Context) : Store {
  private val helper =
    object : SQLiteOpenHelper(context, "bloom-kv.db", null, 1) {
      override fun onConfigure(db: SQLiteDatabase) {
        db.enableWriteAheadLogging()
      }

      override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
          "CREATE TABLE IF NOT EXISTS bloom_kv (name TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (name, key))"
        )
      }

      override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit
    }
  private val db: SQLiteDatabase by lazy { helper.writableDatabase }
  private val read: SQLiteStatement by lazy {
    db.compileStatement("SELECT value FROM bloom_kv WHERE name = ? AND key = ?")
  }
  private val write: SQLiteStatement by lazy {
    db.compileStatement("INSERT OR REPLACE INTO bloom_kv (name, key, value) VALUES (?, ?, ?)")
  }
  private val delete: SQLiteStatement by lazy {
    db.compileStatement("DELETE FROM bloom_kv WHERE name = ? AND key = ?")
  }

  @Synchronized
  override fun get(name: String, key: String): String? {
    read.bindString(1, name)
    read.bindString(2, key)
    return try {
      read.simpleQueryForString()
    } catch (_: android.database.sqlite.SQLiteDoneException) {
      null
    } finally {
      read.clearBindings()
    }
  }

  @Synchronized
  override fun set(name: String, key: String, value: String?) {
    val statement = if (value == null) delete else write
    statement.bindString(1, name)
    statement.bindString(2, key)
    if (value != null) statement.bindString(3, value)
    statement.execute()
    statement.clearBindings()
  }

  @Synchronized
  override fun keys(name: String): List<String> =
    db.rawQuery("SELECT key FROM bloom_kv WHERE name = ? ORDER BY key", arrayOf(name)).use { cursor ->
      buildList { while (cursor.moveToNext()) add(cursor.getString(0)) }
    }

  fun close() = helper.close()
}

/**
 * `secure`: each secret AES-256-GCM encrypted under one key the Android Keystore generates
 * and never releases, stored (IV and ciphertext, base64) in a private preferences file.
 * The keystore can only decrypt on this device, for this app.
 */
internal class SecureStore(context: Context) : Store {
  private val prefs = context.getSharedPreferences("bloom.secure", Context.MODE_PRIVATE)
  private val key: SecretKey by lazy { keystoreKey() }

  private fun slot(name: String, key: String) = "${encode(name)}/${encode(key)}"

  override fun get(name: String, key: String): String? {
    val stored = prefs.getString(slot(name, key), null) ?: return null
    val bytes = Base64.decode(stored, Base64.NO_WRAP)
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.DECRYPT_MODE, this.key, GCMParameterSpec(128, bytes, 0, IV_BYTES))
    return String(cipher.doFinal(bytes, IV_BYTES, bytes.size - IV_BYTES), Charsets.UTF_8)
  }

  override fun set(name: String, key: String, value: String?) {
    if (value == null) {
      prefs.edit().remove(slot(name, key)).commit()
      return
    }
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, this.key)
    val sealed = cipher.iv + cipher.doFinal(value.toByteArray(Charsets.UTF_8))
    prefs.edit().putString(slot(name, key), Base64.encodeToString(sealed, Base64.NO_WRAP)).commit()
  }

  override fun keys(name: String): List<String> {
    val prefix = "${encode(name)}/"
    return prefs.all.keys.filter { it.startsWith(prefix) }.map { decode(it.removePrefix(prefix)) }.sorted()
  }

  private fun keystoreKey(): SecretKey {
    val keystore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
    (keystore.getEntry(ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
    generator.init(
      KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build()
    )
    return generator.generateKey()
  }

  private companion object {
    const val KEYSTORE = "AndroidKeyStore"
    const val ALIAS = "so.oxy.bloom.storage"
    const val TRANSFORMATION = "AES/GCM/NoPadding"
    const val IV_BYTES = 12
  }
}

/** `file`: each store a directory of the app's files, each path one file (its name percent-encoded). */
internal class FileStore(context: Context) : Store {
  private val root = File(context.filesDir, "bloom")

  private fun dir(name: String) = File(root, encode(name))

  override fun get(name: String, key: String): String? {
    val file = File(dir(name), encode(key))
    return if (file.isFile) file.readText() else null
  }

  override fun set(name: String, key: String, value: String?) {
    val file = File(dir(name), encode(key))
    if (value == null) {
      file.delete()
      return
    }
    file.parentFile?.mkdirs()
    file.writeText(value)
  }

  override fun keys(name: String): List<String> = dir(name).list()?.map(::decode) ?: emptyList()
}

private fun encode(s: String): String = URLEncoder.encode(s, "UTF-8")

private fun decode(s: String): String = URLDecoder.decode(s, "UTF-8")
