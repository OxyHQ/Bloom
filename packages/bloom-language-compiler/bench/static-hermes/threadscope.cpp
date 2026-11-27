// The two fbjni symbols the Android VM uses, as no-ops, for a command-line process with no JavaVM.
// hermes.cpp wraps the JSI finalizer thread in a facebook::jni::ThreadScope (to release JNI
// references from finalizers); outside an app there is no JVM, the real ThreadScope throws and the
// process aborts at exit. With these, the finalizer thread runs unwrapped, as on every other OS.
namespace facebook { namespace jni {
class ThreadScope { public: ThreadScope(); ~ThreadScope(); };
ThreadScope::ThreadScope() {}
ThreadScope::~ThreadScope() {}
}}
