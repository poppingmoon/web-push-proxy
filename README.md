# Web Push Proxy

Forwards Web Push notifications via APNs.

## Setup

1. Obtain a key from Apple Developer.
   - See [Establishing a token-based connection to APNs].
2. Set the following environment variables.
   - `APPLE_BUNDLE_ID`: Bundle Identifier of your app
   - `APPLE_ENCRYPTION_KEY`: Contents of the generated key file
   - `APPLE_ENCRYPTION_KEY_ID`: Key ID of the key
   - `APPLE_TEAM_ID`: Your Team ID
3. Connect a KV

[Establishing a token-based connection to APNs]: https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns#Obtain-an-encryption-key-and-key-ID-from-Apple
