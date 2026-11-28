// Bloom (I/O): `HTTPClient`, async throwing requests with typed decoding and cancellation,
// over `URLSession`.
//
// A status outside 200–299 throws an `HTTPError` (its status and body); a network failure, a
// timeout (`URLError(.timedOut)`) or a cancellation (`CancellationError`) throws the
// platform's error. `cancellation:` stops the request when its signal fires; the task's own
// cancellation does too.
import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// What the runtime answers for a request.
public struct HTTPReply: Equatable, Hashable, Sendable {
  public let status: Int
  public let text: String
  /// Lower-cased names, sorted (as `fetch`'s `Headers` iterates them).
  public let headers: OrderedDictionary<String, String>

  public init(status: Int, text: String, headers: OrderedDictionary<String, String>) {
    self.status = status
    self.text = text
    self.headers = headers
  }
}

/// A request's verb.
public enum HTTPMethod: String, Sendable, Hashable, CaseIterable {
  case get = "GET"
  case post = "POST"
  case put = "PUT"
  case patch = "PATCH"
  case delete = "DELETE"
}

/// One request, as `HTTPClient` sends it to its transport.
public struct HTTPRequest: Equatable, Hashable, Sendable {
  public let method: String
  public let url: String
  public let headers: OrderedDictionary<String, String>
  public let body: String?
  public let timeoutSeconds: Double
}

/// What sends requests: `URLSession` by default; a test installs its own
/// (`HTTPClient.transport = …`).
public protocol HTTPTransport: Sendable {
  func send(_ request: HTTPRequest, cancellation: TaskSignal?) async throws -> HTTPReply
}

/// A response: its status, headers (lower-cased names) and body.
public struct HTTPResponse: Equatable, Hashable, Sendable {
  public let status: Int
  public let headers: OrderedDictionary<String, String>
  public let text: String

  public init(status: Int, headers: OrderedDictionary<String, String>, text: String) {
    self.status = status
    self.headers = headers
    self.text = text
  }

  /// Whether the status is 200–299.
  public var isSuccess: Bool { status >= 200 && status < 300 }

  /// The body as JSON.
  public func json() throws -> JSONValue { try JSON.parse(text) }

  /// The body decoded as a `T` (`response.decode(Post.self)`).
  public func decode<T: Decodable>(_ type: T.Type) throws -> T { try JSON.decode(type, from: text) }
}

/// A response whose status is outside 200–299.
public struct HTTPError: Error, Equatable, Hashable, Sendable, LocalizedError, CustomStringConvertible {
  public let status: Int
  /// The response's body (often the server's error JSON).
  public let body: String
  /// "GET https://…: 404".
  public let message: String
  /// The response itself: its status, headers and body.
  public let response: HTTPResponse

  public init(status: Int, body: String, message: String, response: HTTPResponse) {
    self.status = status
    self.body = body
    self.message = message
    self.response = response
  }

  public var errorDescription: String? { message }
  public var description: String { message }

  /// The `HTTPError` an error is, or `none` (`error as? HTTPError`).
  public static func cast(_ error: any Error) -> HTTPError? { error as? HTTPError }
}

/// A client for one server: its base URL, the headers every request sends and a timeout.
public struct HTTPClient: Equatable, Hashable, Sendable {
  public let baseURL: BloomURL
  public var headers: OrderedDictionary<String, String> = [:]
  /// Each request's timeout, in seconds (`timeout(_:)` sets it from a `Duration`).
  public var timeoutSeconds: Double = 30.0

  public init(baseURL: BloomURL, headers: OrderedDictionary<String, String> = [:], timeoutSeconds: Double = 30.0) {
    self.baseURL = baseURL
    self.headers = headers
    self.timeoutSeconds = timeoutSeconds
  }

  private static let installed = Locked<any HTTPTransport>(URLSessionTransport())

  /// Where every client's requests go (`URLSessionTransport()` unless a test installs another).
  public static var transport: any HTTPTransport {
    get { installed.withLock { $0 } }
    set { installed.withLock { $0 = newValue } }
  }

  /// The client with one more header on every request.
  public func adding(header name: String, value: String) -> HTTPClient {
    HTTPClient(baseURL: baseURL, headers: headers.setting(name, value), timeoutSeconds: timeoutSeconds)
  }

  /// The client with this timeout per request.
  public func timeout(_ duration: Duration) -> HTTPClient {
    HTTPClient(baseURL: baseURL, headers: headers, timeoutSeconds: duration.seconds)
  }

  /// The URL of `path` (relative to `baseURL`) with `query`.
  public func url(_ path: String, query: OrderedDictionary<String, String> = [:]) -> BloomURL {
    baseURL.appending(path: path).appendingQuery(query)
  }

  /// The request `send` makes.
  public func request(_ method: HTTPMethod, _ path: String, query: OrderedDictionary<String, String> = [:], json body: JSONValue? = nil) -> HTTPRequest {
    let target = url(path, query: query)
    let headers = body == nil ? self.headers : self.headers.setting("content-type", "application/json")
    return HTTPRequest(
      method: method.rawValue, url: target.absoluteString, headers: headers, body: body.map { JSON.stringify($0) },
      timeoutSeconds: timeoutSeconds)
  }

  /// One request; throws an `HTTPError` unless its status is 200–299.
  @discardableResult
  public func send(
    _ method: HTTPMethod,
    _ path: String,
    query: OrderedDictionary<String, String> = [:],
    json body: JSONValue? = nil,
    cancellation: TaskSignal? = nil
  ) async throws -> HTTPResponse {
    let request = self.request(method, path, query: query, json: body)
    let reply = try await HTTPClient.transport.send(request, cancellation: cancellation)
    let response = HTTPResponse(status: reply.status, headers: reply.headers, text: reply.text)
    if !response.isSuccess {
      throw HTTPError(status: reply.status, body: reply.text, message: "\(method.rawValue) \(request.url): \(reply.status)", response: response)
    }
    return response
  }

  /// `GET path`, its body decoded as a `T`.
  public func get<T: Decodable>(
    _ path: String, as type: T.Type, query: OrderedDictionary<String, String> = [:], cancellation: TaskSignal? = nil
  ) async throws -> T {
    try await send(.get, path, query: query, cancellation: cancellation).decode(type)
  }

  /// `POST path` with `body` (encoded as `encoding`), the answer decoded as a `T`.
  public func post<B: Encodable, T: Decodable>(
    _ path: String, body: B, encoding: B.Type, as type: T.Type, cancellation: TaskSignal? = nil
  ) async throws -> T {
    try await send(.post, path, json: encodeValue(body), cancellation: cancellation).decode(type)
  }

  /// `method path` with a JSON body, the answer ignored (`POST /posts/:id/like`).
  public func perform(_ method: HTTPMethod, _ path: String, json body: JSONValue? = nil, cancellation: TaskSignal? = nil) async throws {
    try await send(method, path, json: body, cancellation: cancellation)
  }
}

extension Error {
  /// The status, when this is an `HTTPError`; else `none` (a network failure, a timeout, a
  /// cancellation).
  public var httpStatus: Int? { (self as? HTTPError)?.status }

  /// The response's body, when this is an `HTTPError`.
  public var httpBody: String? { (self as? HTTPError)?.body }
}

/// Requests over `URLSession` (no cache, as `fetch` from an app reads the network).
public struct URLSessionTransport: HTTPTransport {
  private let session: URLSession

  public init(session: URLSession = .shared) { self.session = session }

  public func send(_ request: HTTPRequest, cancellation: TaskSignal?) async throws -> HTTPReply {
    guard let url = Foundation.URL(string: request.url) else { throw URLError(.badURL) }
    var r = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: request.timeoutSeconds > 0 ? request.timeoutSeconds : 60)
    r.httpMethod = request.method
    for (name, value) in request.headers { r.setValue(value, forHTTPHeaderField: name) }
    r.httpBody = request.body.map { Data($0.utf8) }
    try cancellation?.checkCancellation()
    try Task.checkCancellation()
    // A data task and a continuation resumed once: by its answer, by the signal, by the task's
    // cancellation or by the timeout (whichever comes first; the task is cancelled for the rest).
    // URLSession's own async `data(for:)` does not always return when cancelled on Linux.
    let once = Locked<CheckedContinuation<(Data, URLResponse), any Error>?>(nil)
    let unsubscribe = Locked<(@Sendable () -> Void)?>(nil)
    let finish: @Sendable (Result<(Data, URLResponse), any Error>) -> Void = { result in
      let continuation = once.withLock { c in
        defer { c = nil }
        return c
      }
      continuation?.resume(with: result)
      if continuation != nil { unsubscribe.withLock { $0 }?() }
    }
    let box = Locked<URLSessionDataTask?>(nil)
    let stop: @Sendable (any Error) -> Void = { error in
      box.withLock { $0 }?.cancel()
      finish(.failure(error))
    }
    let (data, response): (Data, URLResponse) = try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        once.withLock { $0 = continuation }
        let task = session.dataTask(with: r) { data, response, error in
          if let error {
            finish(.failure(error))
          } else if let data, let response {
            finish(.success((data, response)))
          } else {
            finish(.failure(URLError(.badServerResponse)))
          }
        }
        box.withLock { $0 = task }
        if let cancellation {
          // Outside the lock: a signal that already fired runs the handler at once.
          let off = cancellation.onCancel { stop(CancellationError()) }
          unsubscribe.withLock { $0 = off }
        }
        if request.timeoutSeconds > 0 {
          let deadline = DispatchTime.now() + request.timeoutSeconds
          DispatchQueue.global().asyncAfter(deadline: deadline) { stop(URLError(.timedOut)) }
        }
        task.resume()
      }
    } onCancel: {
      stop(CancellationError())
    }
    guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
    var headers: [(String, String)] = []
    for (name, value) in http.allHeaderFields {
      headers.append((String(describing: name).lowercased(), String(describing: value)))
    }
    headers.sort { $0.0 < $1.0 }
    var text = String(decoding: data, as: UTF8.self)
    if text.hasPrefix("\u{FEFF}") { text.removeFirst() }
    return HTTPReply(status: http.statusCode, text: text, headers: OrderedDictionary(headers))
  }
}
