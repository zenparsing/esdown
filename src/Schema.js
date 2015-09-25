const NODE_SCHEME = /^node:/i,
      URI_SCHEME = /^[a-z]+:/i;

export function isLegacyScheme(spec) {

    return NODE_SCHEME.test(spec);
}

export function removeScheme(uri) {

    return uri.replace(URI_SCHEME, "");
}

export function hasScheme(uri) {

    return URI_SCHEME.test(uri);
}

export function addLegacyScheme(uri) {

    return "node:" + uri;
}
