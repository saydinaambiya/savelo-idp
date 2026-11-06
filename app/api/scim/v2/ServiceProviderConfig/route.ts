import { NextResponse } from "next/server";

/**
 * SCIM 2.0 Service Provider Configuration Endpoint (RFC 7644 Section 4)
 * Returns metadata describing the SCIM capabilities supported by Savelo IdP.
 */
export async function GET() {
  const config = {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: "https://idp.savelo.com/docs/api/reference",
    patch: {
      supported: true,
    },
    bulk: {
      supported: false,
      maxOperations: 0,
      maxPayloadSize: 0,
    },
    filter: {
      supported: true,
      maxResults: 100,
    },
    changePassword: {
      supported: false,
    },
    sort: {
      supported: false,
    },
    etag: {
      supported: false,
    },
    authenticationSchemes: [
      {
        name: "OAuth Bearer Token",
        description: "Authentication scheme using HTTP Authorization Bearer token",
        specUri: "https://tools.ietf.org/html/rfc6750",
        type: "oauthbearertoken",
        primary: true,
      },
    ],
    meta: {
      location: "/api/scim/v2/ServiceProviderConfig",
      resourceType: "ServiceProviderConfig",
    },
  };

  return NextResponse.json(config, {
    headers: {
      "Content-Type": "application/scim+json; charset=utf-8",
    },
  });
}
