import Foundation
import Testing
@testable import Bloom

private struct Echo: Codable, Equatable {
  let method: String
  let path: String
  let body: String
  let contentType: String?
  let auth: String?
}

/// A transport that answers from a closure and records the requests.
private final class FakeTransport: HTTPTransport, @unchecked Sendable {
  let sent = Locked([HTTPRequest]())
  let answer: @Sendable (HTTPRequest) -> HTTPReply
  init(_ answer: @escaping @Sendable (HTTPRequest) -> HTTPReply) { self.answer = answer }
  func send(_ request: HTTPRequest, cancellation: TaskSignal?) async throws -> HTTPReply {
    sent.withLock { $0.append(request) }
    return answer(request)
  }
}

/// `HTTPClient.transport` is global: the suite runs its tests one at a time.
@Suite(.serialized) struct HTTPTests {
  @Test func buildsRequestsAndDecodes() async throws {
    let fake = FakeTransport { r in
      HTTPReply(status: r.url.contains("missing") ? 404 : 200, text: #"{"id":"u1","name":"Ana"}"#, headers: ["content-type": "application/json"])
    }
    let saved = HTTPClient.transport
    HTTPClient.transport = fake
    defer { HTTPClient.transport = saved }

    let api = HTTPClient(baseURL: BloomURL.parse("https://api.mention.earth/v1")!).adding(header: "Authorization", value: "Bearer t").timeout(.seconds(5))
    struct User: Codable, Equatable { let id: String; let name: String }
    let user = try await api.get("users/me", as: User.self, query: ["b": "2", "a": "1 1"])
    #expect(user == User(id: "u1", name: "Ana"))
    let created = try await api.post("users", body: User(id: "x", name: "é"), encoding: User.self, as: User.self)
    #expect(created.id == "u1")
    try await api.perform(.delete, "users/x")
    let requests = fake.sent.withLock { $0 }
    #expect(requests[0] == HTTPRequest(method: "GET", url: "https://api.mention.earth/v1/users/me?a=1%201&b=2", headers: ["Authorization": "Bearer t"], body: nil, timeoutSeconds: 5))
    #expect(requests[1].method == "POST")
    #expect(requests[1].headers["content-type"] == "application/json")
    #expect(requests[1].body == #"{"id":"x","name":"é"}"#)
    #expect(requests[2].method == "DELETE" && requests[2].body == nil)

    do {
      try await api.perform(.get, "missing")
      Issue.record("no error")
    } catch let error as HTTPError {
      #expect(error.status == 404)
      #expect(error.message == "GET https://api.mention.earth/v1/missing: 404")
      #expect(error.response.headers["content-type"] == "application/json")
      let any: any Error = error
      #expect(any.httpStatus == 404 && any.httpBody == error.body && HTTPError.cast(any) == error)
    }
    let response = try await api.send(.get, "x")
    #expect(response.isSuccess)
    #expect(try response.json()["name"] == "Ana")
  }

  @Test func overURLSession() async throws {
    guard let server = LocalServer.start() else {
      Issue.record("python3 http server did not start")
      return
    }
    defer { server.stop() }
    let api = HTTPClient(baseURL: BloomURL.parse("http://127.0.0.1:\(server.port)")!).adding(header: "X-Auth", value: "k")
    let echo = try await api.post("echo/a b", body: ["x": 1] as OrderedDictionary<String, Int>, encoding: OrderedDictionary<String, Int>.self, as: Echo.self)
    #expect(echo == Echo(method: "POST", path: "/echo/a%20b", body: #"{"x":1}"#, contentType: "application/json", auth: "k"))
    let got = try await api.send(.get, "echo")
    #expect(got.headers["x-bloom"] == "yes")
    #expect(got.headers.keys == got.headers.keys.sorted())
    await #expect(throws: HTTPError.self) { try await api.perform(.get, "status/418") }

    // The signal cancels; the timeout times out.
    let signal = TaskSignal()
    Task {
      try await Task.sleep(for: .milliseconds(100))
      signal.cancel()
    }
    await #expect(throws: CancellationError.self) { try await api.perform(.get, "slow", cancellation: signal) }
    do {
      try await api.timeout(.milliseconds(150)).perform(.get, "slow")
      Issue.record("no timeout")
    } catch let error as URLError {
      #expect(error.code == .timedOut)
    }
  }
}

/// `python3`'s http.server answering `/echo…` with the request, `/status/<n>` with that
/// status and `/slow` after two seconds.
private struct LocalServer {
  let process: Process
  let port: Int

  static let script = #"""
import http.server, json, sys, time
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def answer(self):
        n = int(self.headers.get('content-length') or 0)
        body = self.rfile.read(n).decode()
        if self.path.startswith('/status/'):
            code = int(self.path.split('/')[2]); data = b'{"error":"teapot"}'
        elif self.path == '/slow':
            time.sleep(2); code = 200; data = b'{}'
        else:
            code = 200
            data = json.dumps({'method': self.command, 'path': self.path, 'body': body,
                'contentType': self.headers.get('content-type'), 'auth': self.headers.get('x-auth')}).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('X-Bloom', 'yes')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    do_GET = do_POST = do_DELETE = do_PUT = do_PATCH = answer
s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H)
print(s.server_address[1], flush=True)
s.serve_forever()
"""#

  static func start() -> LocalServer? {
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    p.arguments = ["python3", "-c", script]
    let out = Pipe()
    p.standardOutput = out
    // Nothing of the runner's own: a test harness waits for its outputs to close.
    p.standardError = FileHandle.nullDevice
    p.standardInput = FileHandle.nullDevice
    guard (try? p.run()) != nil else { return nil }
    var line = Data()
    while let byte = try? out.fileHandleForReading.read(upToCount: 1), let b = byte.first, b != 10 { line.append(b) }
    guard let port = Int(String(decoding: line, as: UTF8.self)) else {
      p.terminate()
      return nil
    }
    return LocalServer(process: p, port: port)
  }

  /// SIGKILL: the child inherits the test runner's blocked signals, so SIGTERM waits forever.
  func stop() {
    kill(process.processIdentifier, SIGKILL)
    process.waitUntilExit()
  }
}
