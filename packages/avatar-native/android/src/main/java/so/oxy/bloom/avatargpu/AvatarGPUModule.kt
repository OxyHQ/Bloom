package so.oxy.bloom.avatargpu

import android.content.Context
import android.graphics.Rect
import android.graphics.SurfaceTexture
import android.graphics.Bitmap
import android.opengl.EGL14
import android.opengl.GLES30.*
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.view.TextureView
import android.view.ViewTreeObserver
import expo.modules.gl.GLContext
import expo.modules.gl.GLModule
import expo.modules.gl.cpp.EXGL
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.EventDispatcher
import java.io.ByteArrayOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import javax.microedition.khronos.egl.EGLSurface
import javax.microedition.khronos.egl.EGL10

internal class AvatarGPUSession(val context: GLContext) {
  val closing = AtomicBoolean(false)
  var validatedFramebuffer = 0
}

/** One native GL queue presents the shared engine's atlas into ordinary native views. */
class AvatarGPUModule : Module() {
  private val sessions = ConcurrentHashMap<Int, AvatarGPUSession>()
  private val views = ConcurrentHashMap<Int, AvatarGPUView>()
  private val main = Handler(Looper.getMainLooper())
  private val imageEncoder = Executors.newSingleThreadExecutor()
  private val destroyed = AtomicBoolean(false)
  private val lifecycleLock = Any()

  private fun closeSession(session: AvatarGPUSession, complete: () -> Unit = {}) {
    main.post {
      views.values.filter { it.binding?.session === session }.forEach { it.connect(null) }
      session.context.runAsync {
        Thread({ session.context.destroy(); complete() }, "BloomAvatarDisposal").start()
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("BloomAvatarGPU")
    Events("onPresented")
    Constants("abiVersion" to 1)
    AsyncFunction("createContext") { promise: Promise ->
      check(!destroyed.get())
      val manager = appContext.registry.getModule<GLModule>() ?: error("ExpoGL missing")
      val context = GLContext(manager)
      context.initialize(null, false) {
        val session = AvatarGPUSession(context)
        val admitted = synchronized(lifecycleLock) {
          if (destroyed.get()) false
          else { sessions[context.contextId] = session; true }
        }
        if (admitted) promise.resolve(context.contextId)
        else {
          session.closing.set(true)
          closeSession(session)
          promise.reject("E_AVATAR_CONTEXT", "Avatar module was disposed", null)
        }
      }
    }
    Function("multisampleStorage") { id: Int, target: Int, samples: Int, format: Int, width: Int, height: Int ->
      val session = sessions[id] ?: error("Context unavailable")
      check(!session.closing.get())
      require(samples > 0 && width > 0 && height > 0)
      // JS flushes EXGL's preceding bind commands before this ordered operation.
      session.context.runAsync {
        glRenderbufferStorageMultisample(target, samples, format, width, height)
      }
    }
    Function("present") { id: Int, framebuffer: Int, tiles: List<List<Int>>, ticket: Int ->
      val session = sessions[id]
      if (session == null || session.closing.get()) {
        sendEvent("onPresented", mapOf("ticket" to ticket, "error" to "Avatar context is unavailable"))
      } else session.context.runAsync {
        val context = session.context
        val display = EGL14.eglGetCurrentDisplay()
        val previousContext = EGL14.eglGetCurrentContext()
        val previousReadSurface = EGL14.eglGetCurrentSurface(EGL14.EGL_READ)
        val previousDrawSurface = EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW)
        val previousRead = IntArray(1)
        val previousDraw = IntArray(1)
        glGetIntegerv(GL_READ_FRAMEBUFFER_BINDING, previousRead, 0)
        glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING, previousDraw, 0)
        val scissor = glIsEnabled(GL_SCISSOR_TEST)
        glDisable(GL_SCISSOR_TEST)
        val presented = ArrayList<Int>()
        var failure: String? = null
        try {
          val source = EXGL.EXGLContextGetObject(id, framebuffer)
          check(source != 0) { "Avatar presentation framebuffer is unavailable" }
          if (session.validatedFramebuffer != framebuffer) {
            glBindFramebuffer(GL_READ_FRAMEBUFFER, source)
            val status = glCheckFramebufferStatus(GL_READ_FRAMEBUFFER)
            check(status == GL_FRAMEBUFFER_COMPLETE) { "Avatar framebuffer allocation incomplete: $status" }
            session.validatedFramebuffer = framebuffer
          }
          for (tile in tiles) {
            if (tile.size != 5) continue
            val view = views[tile[0]] ?: continue
            val binding = view.binding ?: continue
            val surface = binding.surface ?: continue
            if (binding.session !== session || view.binding !== binding || !view.visibleToUser ||
              view.surfaceWidth <= 0 || view.surfaceHeight <= 0) continue
            if (!context.makeCurrent(surface)) {
              failure = "Avatar EGL makeCurrent failed: " + EGL14.eglGetError()
              break
            }
            // Native composition still synchronizes display. Do not block once per view's vsync.
            EGL14.eglSwapInterval(EGL14.eglGetCurrentDisplay(), 0)
            glBindFramebuffer(GL_READ_FRAMEBUFFER, source)
            glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0)
            glBlitFramebuffer(tile[1], tile[2], tile[3], tile[4], 0, 0,
              view.surfaceWidth, view.surfaceHeight, GL_COLOR_BUFFER_BIT, GL_LINEAR)
            if (context.swapBuffers(surface)) presented.add(tile[0])
            else { failure = "Avatar EGL presentation failed"; break }
          }
        } catch (error: Exception) {
          failure = error.message ?: "Avatar presentation failed"
        } finally {
          EGL14.eglMakeCurrent(display, previousDrawSurface, previousReadSurface, previousContext)
          glBindFramebuffer(GL_READ_FRAMEBUFFER, previousRead[0])
          glBindFramebuffer(GL_DRAW_FRAMEBUFFER, previousDraw[0])
          if (scissor) glEnable(GL_SCISSOR_TEST)
        }
        sendEvent("onPresented", mapOf("ticket" to ticket, "ids" to presented, "error" to failure))
      }
    }
    // Capture the actual retained native output, including a paused tile. This is
    // explicitly requested once; no readback or encoding occurs in the frame loop.
    AsyncFunction("snapshot") { surfaceId: Int, promise: Promise ->
      main.post {
        if (destroyed.get()) { promise.resolve(null); return@post }
        val bitmap = views[surfaceId]?.takeIf { it.isAvailable }?.bitmap
        if (bitmap == null) promise.resolve(null)
        else imageEncoder.execute {
          try {
            val bytes = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)
            promise.resolve("data:image/png;base64," + Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP))
          } catch (error: Exception) {
            promise.reject("E_AVATAR_SNAPSHOT", error.message, error)
          } finally { bitmap.recycle() }
        }
      }
    }
    Function("stats") {
      mapOf("contexts" to sessions.size, "views" to views.values.map {
        mapOf("id" to it.surfaceId, "width" to it.surfaceWidth, "height" to it.surfaceHeight,
          "visible" to it.visibleToUser, "presentedFrames" to it.presentedFrames)
      })
    }
    AsyncFunction("destroyContext") { id: Int, promise: Promise ->
      val session = sessions.remove(id)
      if (session == null || !session.closing.compareAndSet(false, true)) promise.resolve(null)
      else closeSession(session) { promise.resolve(null) }
    }
    OnDestroy {
      val closing = synchronized(lifecycleLock) {
        destroyed.set(true)
        sessions.values.toList().also { sessions.clear() }
      }
      for (session in closing) {
        if (session.closing.compareAndSet(false, true)) closeSession(session)
      }
      main.post { views.clear(); imageEncoder.shutdown() }
    }
    View(AvatarGPUView::class) {
      Events("onSurfaceReady", "onVisibilityChanged", "onSurfaceError")
      Prop("contextId") { view: AvatarGPUView, id: Int -> view.connect(sessions[id]) }
      Prop("surfaceId") { view: AvatarGPUView, id: Int ->
        views.remove(view.surfaceId, view)
        view.surfaceId = id
        views[id] = view
        view.onWindowAttachment = { attached ->
          if (attached) views[view.surfaceId] = view else views.remove(view.surfaceId, view)
        }
      }
      OnViewDestroys { view: AvatarGPUView ->
        views.remove(view.surfaceId, view)
        view.onWindowAttachment = null
        view.connect(null)
      }
    }
  }
}

internal class AvatarGPUBinding(val session: AvatarGPUSession, val texture: SurfaceTexture) {
  // Only the session's GL queue creates or destroys this handle.
  @Volatile var surface: EGLSurface? = null
}

class AvatarGPUView(context: Context, appContext: AppContext) : TextureView(context), TextureView.SurfaceTextureListener {
  var surfaceId = 0
  @Volatile internal var binding: AvatarGPUBinding? = null
  @Volatile var surfaceWidth = 0
  @Volatile var surfaceHeight = 0
  @Volatile var visibleToUser = false
  @Volatile var presentedFrames = 0L
  private var owner: AvatarGPUSession? = null
  private var attachedTexture: SurfaceTexture? = null
  var onWindowAttachment: ((Boolean) -> Unit)? = null
  private val onSurfaceReady by EventDispatcher()
  private val onSurfaceError by EventDispatcher()
  private val onVisibilityChanged by EventDispatcher()
  private val visibleRect = Rect()
  private val beforeDraw = ViewTreeObserver.OnPreDrawListener { updateVisibility(); true }
  private val main = Handler(Looper.getMainLooper())

  init { isOpaque = false; surfaceTextureListener = this }
  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    onWindowAttachment?.invoke(true)
    viewTreeObserver.addOnPreDrawListener(beforeDraw)
    updateVisibility()
  }
  override fun onDetachedFromWindow() {
    if (viewTreeObserver.isAlive) viewTreeObserver.removeOnPreDrawListener(beforeDraw)
    publishVisibility(false)
    onWindowAttachment?.invoke(false)
    super.onDetachedFromWindow()
  }
  private fun updateVisibility() = publishVisibility(
    isAttachedToWindow && isShown && alpha > 0f && getGlobalVisibleRect(visibleRect) && !visibleRect.isEmpty
  )
  private fun publishVisibility(value: Boolean) {
    if (visibleToUser == value) return
    visibleToUser = value
    onVisibilityChanged(mapOf("visible" to value))
  }
  internal fun connect(session: AvatarGPUSession?) {
    if (owner === session) return
    detach(false)
    owner = session
    if (isAvailable) surfaceTexture?.let { attach(it) }
  }
  private fun attach(texture: SurfaceTexture) {
    val session = owner ?: return
    if (session.closing.get()) return
    attachedTexture = texture
    val next = AvatarGPUBinding(session, texture)
    binding = next
    session.context.runAsync {
      if (binding === next && !session.closing.get()) {
        try {
          val surface = session.context.createSurface(session.context.eglConfig, texture)
          check(surface != null && surface != EGL10.EGL_NO_SURFACE) {
            "Avatar EGL surface allocation failed: " + EGL14.eglGetError()
          }
          next.surface = surface
          main.post {
            if (binding === next) { updateVisibility(); onSurfaceReady(mapOf("visible" to visibleToUser)) }
          }
        } catch (error: Exception) {
          main.post {
            if (binding === next) onSurfaceError(mapOf("message" to (error.message ?: "Avatar EGL surface allocation failed")))
          }
        }
      }
    }
  }
  private fun detach(releaseTexture: Boolean) {
    val old = binding
    val texture = attachedTexture
    binding = null
    if (releaseTexture) attachedTexture = null
    if (old == null) { if (releaseTexture) texture?.release(); return }
    old.session.context.runAsync {
      old.surface?.let { old.session.context.destroySurface(it) }
      old.surface = null
      if (releaseTexture) texture?.release()
    }
  }
  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    attachedTexture = surface
    surfaceWidth = width; surfaceHeight = height; attach(surface)
  }
  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
    surfaceWidth = width; surfaceHeight = height
    onSurfaceReady(mapOf("visible" to visibleToUser))
  }
  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    publishVisibility(false); detach(true)
    // The GL queue releases the producer before releasing its SurfaceTexture.
    return false
  }
  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) { presentedFrames++ }
}
