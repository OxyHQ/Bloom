# Receive-error retry follow-up

The release merge queue reproduced curl 56 / HTTP 000 after the verified fallback had already passed full Android CI. Curl's default `--retry` policy does not retry a receive reset. The only production change adds `--retry-all-errors` to the existing download command; primary/fallback URLs, pins, versions, preflight, integrity checks, and Android build variants remain unchanged.

The local HTTPS integration tests use a generated localhost CA, trusted through `CURL_CA_BUNDLE`, and an actual TCP reset after sending a partial body. No TLS bypass is used. On curl 8.14.1 / OpenSSL 3.5.7:

- The original policy returns curl 56 after one request and leaves a nonempty partial file.
- The updated helper makes two requests when the second succeeds; the output is exactly the complete artifact, without partial-prefix or trailing bytes, and passes the independent SHA256/size check.
- Persistent resets stop after three requests with curl 56. A permanent HTTP 404 also stops after three requests with curl 22. Both remain errors.
- An untrusted certificate fails with curl 60 and reaches no HTTP handler.
- Digest mismatch and size mismatch never invoke a second transport or publish a destination artifact.

The retry count remains two (three attempts total), delay two seconds, per-transfer timeout 90 seconds and retry start window 180 seconds. The start window is **not** a hard 180-second wall-clock deadline: an attempt started within that window can finish later (up to approximately another 90 seconds). Permanent HTTP/TLS failures now incur the same bounded retry cost. Tests exercise fast failures with actual curl; they assert the configured long timeout limits without deliberately stalling CI for minutes.

Run `python3 .github/scripts/test-verified-android-downloads.py -v`. This includes the prior archive, checksum, version, cleanup and fallback tests. Local transport tests do not establish a successful remote artifact download or replace the three Android CI builds.
