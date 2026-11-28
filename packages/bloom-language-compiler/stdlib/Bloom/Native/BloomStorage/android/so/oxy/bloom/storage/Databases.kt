// Bloom's native storage module: `@Model`'s SQLite (the `sql…` functions of
// `extern native "BloomStorage"`, stdlib/Bloom/Storage.bloom).
package so.oxy.bloom.storage

import android.content.Context
import android.database.Cursor
import android.database.CursorWindow
import android.database.DatabaseUtils
import android.database.sqlite.SQLiteCursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteProgram
import android.database.sqlite.SQLiteStatement
import org.json.JSONArray
import org.json.JSONObject

/**
 * The app's SQLite databases by handle, on Android's own SQLite (no library in the APK).
 * Every call runs on the JS thread, synchronously, as expo-sqlite's synchronous API does.
 *
 * - **Parameters** arrive as one JSON array and are bound by type (text, integer, real, null).
 * - **Rows** leave as one string, framed so no text is escaped ([rows]); the JS side
 *   makes the row objects `getAllSync` returns.
 * - **Scripts** (`exec`) are split into statements, since Android runs one per call.
 *   `PRAGMA journal_mode` is answered by the WAL the database is opened with.
 * - **Transactions.** `BEGIN`, `COMMIT` and `ROLLBACK` go through Android's session, which
 *   keeps one transaction per thread.
 */
internal class Databases(private val context: Context) {
  private class Open(val name: String, val db: SQLiteDatabase) {
    /**
     * One cursor window for every query, instead of a new 2 MB window each: a cursor's close
     * only drops the reference [all] takes for it.
     */
    val window = CursorWindow("bloom-sql")

    /** Compiled statements by source, for the statements run again and again. */
    val statements =
      object : LinkedHashMap<String, SQLiteStatement>(32, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, SQLiteStatement>): Boolean =
          (size > 48).also { if (it) eldest.value.close() }
      }
  }

  private val open = HashMap<Int, Open>()
  private val byName = HashMap<String, Int>()
  private var next = 1

  @Synchronized
  fun open(name: String): Int {
    byName[name]?.let { return it }
    val file = context.getDatabasePath(name)
    file.parentFile?.mkdirs()
    val db =
      SQLiteDatabase.openDatabase(
        file.path,
        null,
        SQLiteDatabase.OPEN_READWRITE or SQLiteDatabase.CREATE_IF_NECESSARY or SQLiteDatabase.ENABLE_WRITE_AHEAD_LOGGING,
      )
    val handle = next++
    open[handle] = Open(name, db)
    byName[name] = handle
    return handle
  }

  private fun get(handle: Int): Open =
    open[handle] ?: throw IllegalStateException("BloomStorage: no open database $handle")

  @Synchronized
  fun exec(handle: Int, source: String) {
    val db = get(handle).db
    for (statement in split(source)) {
      when (DatabaseUtils.getSqlStatementType(statement)) {
        DatabaseUtils.STATEMENT_PRAGMA ->
          if (!JOURNAL_MODE.containsMatchIn(statement)) db.rawQuery(statement, null).use { it.moveToFirst() }
        DatabaseUtils.STATEMENT_SELECT -> db.rawQuery(statement, null).use { it.moveToFirst() }
        else -> db.execSQL(statement)
      }
    }
  }

  @Synchronized
  fun run(handle: Int, source: String, params: String): Int {
    val opened = get(handle)
    val args = JSONArray(params)
    when (DatabaseUtils.getSqlStatementType(source)) {
      DatabaseUtils.STATEMENT_BEGIN,
      DatabaseUtils.STATEMENT_COMMIT,
      DatabaseUtils.STATEMENT_ABORT,
      DatabaseUtils.STATEMENT_PRAGMA,
      DatabaseUtils.STATEMENT_DDL -> {
        if (args.length() > 0) throw IllegalArgumentException("BloomStorage: `$source` takes no parameters")
        exec(handle, source)
        return 0
      }
      DatabaseUtils.STATEMENT_SELECT -> {
        all(handle, source, params)
        return 0
      }
    }
    val statement = opened.statements.getOrPut(source) { opened.db.compileStatement(source) }
    try {
      bind(statement, args)
      return statement.executeUpdateDelete()
    } finally {
      statement.clearBindings()
    }
  }

  @Synchronized
  fun all(handle: Int, source: String, params: String): String {
    val args = JSONArray(params)
    val opened = get(handle)
    val cursor =
      opened.db.rawQueryWithFactory(
        { _, driver, table, query ->
          bind(query, args)
          SQLiteCursor(driver, table, query).also {
            opened.window.acquireReference()
            it.setWindow(opened.window)
          }
        },
        source,
        null,
        "",
      )
    return cursor.use { rows(it) }
  }

  @Synchronized
  fun close(handle: Int) {
    val opened = open.remove(handle) ?: return
    byName.remove(opened.name)
    opened.statements.values.forEach { it.close() }
    opened.statements.clear()
    opened.window.close()
    opened.db.close()
  }

  @Synchronized
  fun delete(name: String) {
    byName[name]?.let { close(it) }
    SQLiteDatabase.deleteDatabase(context.getDatabasePath(name))
  }

  @Synchronized
  fun closeAll() {
    open.keys.toList().forEach { close(it) }
  }

  companion object {
    private val JOURNAL_MODE = Regex("^\\s*PRAGMA\\s+journal_mode\\b", RegexOption.IGNORE_CASE)

    private fun bind(program: SQLiteProgram, args: JSONArray) {
      for (i in 0 until args.length()) {
        val index = i + 1
        when (val value = args.get(i)) {
          JSONObject.NULL -> program.bindNull(index)
          is String -> program.bindString(index, value)
          is Boolean -> program.bindLong(index, if (value) 1 else 0)
          is Int -> program.bindLong(index, value.toLong())
          is Long -> program.bindLong(index, value)
          is Number -> {
            val d = value.toDouble()
            if (d == Math.rint(d) && Math.abs(d) < 9.007199254740992E15) program.bindLong(index, d.toLong())
            else program.bindDouble(index, d)
          }
          else -> program.bindString(index, value.toString())
        }
      }
    }

    /**
     * The cursor's rows, framed so that no text is escaped or scanned (each cell is one bulk
     * copy): `<columns>;`, each column's name as `<length>:<name>`, then each row's cells in
     * order: `s<length>:<text>`, `i<integer>;`, `f<real>;` or `n` (null; a blob reads as null).
     * `models.ts`'s `decodeRows` reads it back into row objects.
     */
    private fun rows(cursor: Cursor): String {
      val names = cursor.columnNames
      val out = StringBuilder(4096)
      out.append(names.size).append(';')
      for (name in names) out.append(name.length).append(':').append(name)
      val count = names.size
      while (cursor.moveToNext()) {
        for (c in 0 until count) {
          when (cursor.getType(c)) {
            Cursor.FIELD_TYPE_NULL, Cursor.FIELD_TYPE_BLOB -> out.append('n')
            Cursor.FIELD_TYPE_INTEGER -> out.append('i').append(cursor.getLong(c)).append(';')
            Cursor.FIELD_TYPE_FLOAT -> {
              val d = cursor.getDouble(c)
              if (d.isFinite()) out.append('f').append(d).append(';') else out.append('n')
            }
            else -> {
              val text = cursor.getString(c)
              out.append('s').append(text.length).append(':').append(text)
            }
          }
        }
      }
      return out.toString()
    }

    /**
     * A script's statements: split at `;` outside quotes, identifiers and comments (no
     * trigger bodies, which a persister's schema does not have).
     */
    internal fun split(source: String): List<String> {
      val out = ArrayList<String>()
      val current = StringBuilder()
      var i = 0
      val n = source.length
      while (i < n) {
        val ch = source[i]
        when {
          ch == '\'' || ch == '"' || ch == '`' -> {
            val end = source.indexOf(ch, i + 1).let { if (it < 0) n - 1 else it }
            current.append(source, i, end + 1)
            i = end + 1
            // A doubled quote inside a literal: the loop picks up the rest as a new literal.
            continue
          }
          ch == '-' && i + 1 < n && source[i + 1] == '-' -> {
            val end = source.indexOf('\n', i).let { if (it < 0) n else it }
            i = end
            continue
          }
          ch == '/' && i + 1 < n && source[i + 1] == '*' -> {
            val end = source.indexOf("*/", i + 2).let { if (it < 0) n else it + 2 }
            i = end
            continue
          }
          ch == ';' -> {
            current.toString().trim().takeIf { it.isNotEmpty() }?.let(out::add)
            current.setLength(0)
          }
          else -> current.append(ch)
        }
        i++
      }
      current.toString().trim().takeIf { it.isNotEmpty() }?.let(out::add)
      return out
    }
  }
}
